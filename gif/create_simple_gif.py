#!/usr/bin/env python3
from PIL import Image

# 加载图片
finger_img = Image.open('图层 3.png').convert('RGBA')
ripple_img = Image.open('组 1.png').convert('RGBA')

# 创建测试帧 - 直接显示两张图片
test_frame = Image.new('RGBA', (400, 400), (255, 255, 255, 255))

# 粘贴涟漪在中心
ripple_x = (400 - ripple_img.width) // 2
ripple_y = (400 - ripple_img.height) // 2
test_frame.paste(ripple_img, (ripple_x, ripple_y), ripple_img)

# 粘贴手指在涟漪上方
finger_x = (400 - finger_img.width) // 2
finger_y = ripple_y - finger_img.height + 50
test_frame.paste(finger_img, (finger_x, finger_y), finger_img)

# 保存测试图片
test_frame.save('test_composition.png')
print("测试图片已保存: test_composition.png")

# 检查涟漪图片的实际内容
print(f"\n涟漪图片信息:")
print(f"尺寸: {ripple_img.size}")
print(f"模式: {ripple_img.mode}")

# 检查涟漪的透明度
if ripple_img.mode == 'RGBA':
    # 获取alpha通道的最小值和最大值
    _, _, _, alpha = ripple_img.split()
    alpha_data = list(alpha.getdata())
    non_zero_alpha = [a for a in alpha_data if a > 0]
    if non_zero_alpha:
        print(f"Alpha通道: 最小值={min(non_zero_alpha)}, 最大值={max(non_zero_alpha)}")
        print(f"非透明像素数: {len(non_zero_alpha)} / {len(alpha_data)}")
    else:
        print("警告：涟漪图片完全透明！")