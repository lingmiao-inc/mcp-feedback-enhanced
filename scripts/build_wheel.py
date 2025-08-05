#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
MCP Feedback Enhanced - Wheel包构建脚本
=====================================

此脚本用于构建包含所有依赖的wheel包，支持离线安装。

功能：
1. 清理旧的构建文件
2. 构建wheel包
3. 下载所有依赖包
4. 验证构建结果
5. 生成安装脚本

使用方法：
    python scripts/build_wheel.py [--include-deps] [--output-dir DIR]
"""

import os
import sys
import shutil
import subprocess
import argparse
from pathlib import Path
import json
import re

def run_command(cmd, check=True, capture_output=False):
    """运行命令并处理结果"""
    print(f"🔧 执行命令: {' '.join(cmd) if isinstance(cmd, list) else cmd}")
    
    if isinstance(cmd, str):
        cmd = cmd.split()
    
    try:
        result = subprocess.run(
            cmd, 
            check=check, 
            capture_output=capture_output,
            text=True,
            cwd=Path(__file__).parent.parent
        )
        if capture_output:
            return result.stdout.strip()
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ 命令执行失败: {e}")
        if capture_output:
            print(f"错误输出: {e.stderr}")
        return False

def clean_build_dirs():
    """清理构建目录"""
    print("🧹 清理旧的构建文件...")
    
    dirs_to_clean = ['build', 'dist', '*.egg-info']
    for pattern in dirs_to_clean:
        if '*' in pattern:
            # 处理通配符
            import glob
            for path in glob.glob(pattern):
                if os.path.exists(path):
                    shutil.rmtree(path)
                    print(f"   删除: {path}")
        else:
            if os.path.exists(pattern):
                shutil.rmtree(pattern)
                print(f"   删除: {pattern}")

def get_project_info():
    """获取项目信息"""
    print("📋 获取项目信息...")
    
    # 读取pyproject.toml获取项目信息
    try:
        import tomllib
    except ImportError:
        # Python < 3.11
        try:
            import tomli as tomllib
        except ImportError:
            print("❌ 需要安装tomli: pip install tomli")
            return None
    
    with open('pyproject.toml', 'rb') as f:
        config = tomllib.load(f)
    
    project = config['project']
    name = project['name']
    version = project['version']
    
    print(f"   项目名称: {name}")
    print(f"   版本: {version}")
    
    return {
        'name': name,
        'version': version,
        'dependencies': project.get('dependencies', [])
    }

def get_current_version():
    """从 pyproject.toml 获取当前版本"""
    pyproject_path = Path("pyproject.toml")
    content = pyproject_path.read_text(encoding="utf-8")
    match = re.search(r'version = "([^"]+)"', content)
    if match:
        return match.group(1)
    raise ValueError("无法找到版本号")

def verify_version_consistency():
    """验证所有文件中的版本号是否一致"""
    print("🔍 验证版本一致性...")

    # 获取 pyproject.toml 中的版本
    pyproject_version = get_current_version()

    # 获取 __init__.py 中的版本
    init_path = Path("src/mcp_feedback_enhanced/__init__.py")
    init_content = init_path.read_text(encoding="utf-8")
    init_match = re.search(r'__version__ = "([^"]+)"', init_content)
    if not init_match:
        print("❌ 无法在 __init__.py 中找到版本号")
        return False
    init_version = init_match.group(1)

    # 获取 .bumpversion.cfg 中的版本
    bumpversion_path = Path(".bumpversion.cfg")
    if bumpversion_path.exists():
        bumpversion_content = bumpversion_path.read_text(encoding="utf-8")
        bumpversion_match = re.search(r'current_version = ([^\n]+)', bumpversion_content)
        if bumpversion_match:
            bumpversion_version = bumpversion_match.group(1).strip()
        else:
            print("❌ 无法在 .bumpversion.cfg 中找到版本号")
            return False
    else:
        bumpversion_version = None

    # 检查版本一致性
    versions = {
        'pyproject.toml': pyproject_version,
        '__init__.py': init_version,
    }

    if bumpversion_version:
        versions['.bumpversion.cfg'] = bumpversion_version

    print(f"   发现的版本号:")
    for file, version in versions.items():
        print(f"     {file}: {version}")

    # 检查是否所有版本都一致
    unique_versions = set(versions.values())
    if len(unique_versions) == 1:
        print(f"✅ 版本一致性检查通过: {pyproject_version}")
        return True
    else:
        print("❌ 版本不一致！")
        return False

def bump_version(version_type='patch'):
    """自动递增版本号"""
    print(f"📈 递增版本号 ({version_type})...")

    # 检查 bump-my-version 是否可用
    try:
        result = run_command(['uv', 'run', 'bump-my-version', '--help'], capture_output=True, check=False)
        if not result:
            print("❌ 无法运行 bump-my-version，请安装: uv add --dev bump-my-version")
            return False
        bump_cmd = ['uv', 'run', 'bump-my-version']
    except Exception as e:
        print(f"❌ 检查 bump-my-version 时出错: {e}")
        return False

    # 获取当前版本
    old_version = get_current_version()
    print(f"   当前版本: {old_version}")

    # 执行版本递增
    cmd = bump_cmd + ['bump', version_type]
    success = run_command(cmd, check=False)

    if not success:
        print("❌ 版本递增失败")
        return False

    # 获取新版本
    new_version = get_current_version()
    print(f"✅ 版本已更新: {old_version} -> {new_version}")

    return True

def build_wheel():
    """构建wheel包"""
    print("🔨 构建wheel包...")
    
    # 使用python -m build构建
    success = run_command([sys.executable, '-m', 'build', '--wheel'])
    if not success:
        print("❌ wheel包构建失败")
        return False
    
    print("✅ wheel包构建成功")
    return True

def download_dependencies(output_dir, include_deps=True, use_source=False):
    """下载依赖包"""
    if not include_deps:
        print("⏭️  跳过依赖下载")
        return True

    print("📦 下载依赖包...")
    if use_source:
        print("   使用源码包模式（跨平台兼容）")
    else:
        print("   使用二进制包模式（当前平台优化）")

    # 创建依赖目录
    deps_dir = Path(output_dir) / 'dependencies'
    deps_dir.mkdir(exist_ok=True)

    # 首先安装构建依赖
    print("   安装构建依赖...")
    run_command([sys.executable, '-m', 'pip', 'install', 'build', 'wheel'])

    # 获取项目依赖列表
    print("   获取依赖列表...")
    project_info = get_project_info()
    dependencies = project_info.get('dependencies', [])

    # 下载所有依赖包（包括递归依赖）
    print("   下载依赖包...")
    all_packages = ['.'] + dependencies

    for package in all_packages:
        print(f"     下载: {package}")
        cmd = [
            sys.executable, '-m', 'pip', 'download',
            '--dest', str(deps_dir),
        ]

        if use_source:
            cmd.extend(['--no-binary', ':all:'])  # 强制使用源码包，避免架构不匹配
        else:
            cmd.extend(['--prefer-binary'])  # 优先使用二进制包

        cmd.append(package)

        success = run_command(cmd, check=False)  # 不因单个包失败而停止
        if not success:
            print(f"     ⚠️  {package} 下载失败，将在安装时从PyPI获取")

    # 移除重复的包文件
    print("   清理重复文件...")
    seen_packages = set()
    for file in deps_dir.glob('*.whl'):
        # 提取包名（不包括版本）
        package_name = file.name.split('-')[0].lower().replace('_', '-')
        if package_name in seen_packages:
            file.unlink()
            print(f"     删除重复: {file.name}")
        else:
            seen_packages.add(package_name)

    print("✅ 依赖下载完成")
    return True

def create_install_script(output_dir, project_info):
    """创建安装脚本"""
    print("📝 创建安装脚本...")
    
    script_content = f'''#!/bin/bash
# MCP Feedback Enhanced 安装脚本
# 自动生成于构建时

set -e

echo "🚀 开始安装 {project_info['name']} v{project_info['version']}"

# 检查Python版本
python_version=$(python3 --version 2>&1 | cut -d' ' -f2 | cut -d'.' -f1,2)
required_version="3.11"

if [ "$(printf '%s\\n' "$required_version" "$python_version" | sort -V | head -n1)" != "$required_version" ]; then
    echo "❌ 需要Python 3.11或更高版本，当前版本: $python_version"
    exit 1
fi

# 安装依赖（如果存在）
if [ -d "dependencies" ]; then
    echo "📦 安装依赖包..."
    pip3 install --find-links dependencies --no-index dependencies/*.whl
fi

# 安装主包
echo "📦 安装主包..."
pip3 install {project_info['name']}-{project_info['version']}-py3-none-any.whl

# 验证安装
echo "✅ 验证安装..."
if command -v mcp-feedback-enhanced >/dev/null 2>&1; then
    echo "🎉 安装成功！"
    echo "版本信息:"
    mcp-feedback-enhanced version
else
    echo "❌ 安装验证失败"
    exit 1
fi

echo ""
echo "📋 下一步："
echo "1. 更新您的mcp.json配置文件"
echo "2. 重启MCP客户端（如Claude Desktop）"
echo "3. 测试MCP服务功能"
'''
    
    script_path = Path(output_dir) / 'install.sh'
    with open(script_path, 'w', encoding='utf-8') as f:
        f.write(script_content)
    
    # 设置执行权限
    os.chmod(script_path, 0o755)
    
    print(f"✅ 安装脚本已创建: {script_path}")

def verify_build(output_dir, project_info):
    """验证构建结果"""
    print("🔍 验证构建结果...")
    
    wheel_file = f"{project_info['name'].replace('-', '_')}-{project_info['version']}-py3-none-any.whl"
    wheel_path = Path(output_dir) / wheel_file
    
    if not wheel_path.exists():
        print(f"❌ wheel文件不存在: {wheel_path}")
        return False
    
    print(f"✅ wheel文件存在: {wheel_path}")
    print(f"   文件大小: {wheel_path.stat().st_size / 1024:.1f} KB")
    
    return True

def copy_latest_wheel(output_dir, project_info):
    """复制wheel文件并重命名为固定名称"""
    print("📋 复制最新版本wheel文件...")
    
    # 构建原始wheel文件路径
    original_wheel = f"{project_info['name'].replace('-', '_')}-{project_info['version']}-py3-none-any.whl"
    original_path = Path(output_dir) / original_wheel
    
    # 构建目标文件路径（固定名称）
    target_path = Path(output_dir) / "mcp_feedback_enhanced-latest.whl"
    
    try:
        # 使用shutil.copy2复制文件（保持元数据）
        shutil.copy2(original_path, target_path)
        print(f"✅ 已复制为: {target_path.name}")
        print(f"   原文件: {original_path.name}")
        return True
    except FileNotFoundError:
        print(f"❌ 源文件不存在: {original_path}")
        return False
    except Exception as e:
        print(f"❌ 复制失败: {e}")
        return False

def main():
    parser = argparse.ArgumentParser(
        description='构建MCP Feedback Enhanced wheel包（默认自动递增patch版本）',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
使用示例:
  python scripts/build_wheel.py                    # 自动递增patch版本并构建
  python scripts/build_wheel.py --bump-version minor  # 递增minor版本并构建
  python scripts/build_wheel.py --no-bump             # 不递增版本，直接构建
  python scripts/build_wheel.py --include-deps        # 包含依赖包
  python scripts/build_wheel.py --include-deps --use-source  # 跨平台兼容的依赖包
        """
    )

    parser.add_argument('--bump-version',
                       choices=['patch', 'minor', 'major'],
                       help='指定版本递增类型（默认: patch）')
    parser.add_argument('--no-bump', action='store_true',
                       help='跳过版本递增，直接构建')
    parser.add_argument('--include-deps', action='store_true',
                       help='包含所有依赖包（用于离线安装）')
    parser.add_argument('--use-source', action='store_true',
                       help='使用源码包而不是二进制包（跨平台兼容）')
    parser.add_argument('--output-dir', default='dist',
                       help='输出目录（默认: dist）')

    args = parser.parse_args()
    
    print("🏗️  MCP Feedback Enhanced Wheel包构建器")
    print("=" * 50)

    # 检查是否在项目根目录
    if not Path('pyproject.toml').exists():
        print("❌ 请在项目根目录运行此脚本")
        sys.exit(1)

    # 版本管理逻辑
    if not args.no_bump:
        # 默认递增patch版本，除非指定了其他类型
        version_type = args.bump_version or 'patch'

        print(f"🔄 版本管理模式: 递增 {version_type} 版本")

        # 验证当前版本一致性
        if not verify_version_consistency():
            print("❌ 版本不一致，请先修复版本问题")
            sys.exit(1)

        # 递增版本号
        if not bump_version(version_type):
            print("❌ 版本递增失败")
            sys.exit(1)
    else:
        print("⏭️  跳过版本递增")

        # 即使不递增版本，也要验证一致性
        if not verify_version_consistency():
            print("⚠️  版本不一致，但继续构建...")

    # 获取项目信息（可能已更新版本）
    project_info = get_project_info()
    if not project_info:
        sys.exit(1)

    # 清理旧文件
    clean_build_dirs()
    
    # 构建wheel包
    if not build_wheel():
        sys.exit(1)

    # 确保输出目录存在
    output_dir = Path(args.output_dir)
    output_dir.mkdir(exist_ok=True)

    # 复制wheel文件到输出目录（如果输出目录不是dist）
    wheel_file = f"{project_info['name'].replace('-', '_')}-{project_info['version']}-py3-none-any.whl"
    source_wheel = Path('dist') / wheel_file
    target_wheel = output_dir / wheel_file

    if source_wheel.exists():
        # 只有当输出目录不是dist时才复制
        if output_dir.resolve() != Path('dist').resolve():
            shutil.copy2(source_wheel, target_wheel)
            print(f"📋 已复制wheel文件到: {target_wheel}")
        else:
            print(f"📋 wheel文件已在目标目录: {source_wheel}")
    else:
        print(f"❌ 源wheel文件不存在: {source_wheel}")
        sys.exit(1)
    
    # 下载依赖
    if not download_dependencies(output_dir, args.include_deps, args.use_source):
        sys.exit(1)
    
    # 创建安装脚本
    create_install_script(output_dir, project_info)
    
    # 验证构建结果
    if not verify_build(output_dir, project_info):
        sys.exit(1)
    
    # 复制最新版本的wheel文件
    if not copy_latest_wheel(output_dir, project_info):
        sys.exit(1)
    
    print("\n🎉 构建完成！")
    print(f"📁 输出目录: {output_dir.absolute()}")
    print("\n📋 文件列表:")
    for file in sorted(output_dir.iterdir()):
        if file.is_file():
            size = file.stat().st_size / 1024
            print(f"   {file.name} ({size:.1f} KB)")
    
    print(f"\n🚀 安装命令:")
    print(f"   cd {output_dir}")
    print(f"   ./install.sh")

if __name__ == '__main__':
    main()
