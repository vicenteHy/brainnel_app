#!/usr/bin/env python3
from PIL import Image, ImageEnhance

# 加载图片
finger_img = Image.open('图层 3.png').convert('RGBA')
ripple_img = Image.open('组 1.png').convert('RGBA')

# 增强涟漪的可见度
enhancer = ImageEnhance.Color(ripple_img)
ripple_enhanced = enhancer.enhance(2.0)  # 增强颜色饱和度

# 创建帧列表
frames = []
width, height = 300, 300

# 动画参数
finger_x = (width - finger_img.width) // 2
finger_start_y = 30
finger_end_y = 100
ripple_x = (width - ripple_img.width) // 2
ripple_y = finger_end_y + finger_img.height - 40

# 创建简单的3帧动画
# 帧1: 只有手指
frame1 = Image.new('RGB', (width, height), (240, 240, 240))
frame1_rgba = frame1.convert('RGBA')
frame1_rgba.paste(finger_img, (finger_x, finger_start_y), finger_img)
frames.append(frame1_rgba.convert('RGB'))

# 帧2: 手指按下
frame2 = Image.new('RGB', (width, height), (240, 240, 240))
frame2_rgba = frame2.convert('RGBA')
frame2_rgba.paste(finger_img, (finger_x, finger_end_y), finger_img)
frames.append(frame2_rgba.convert('RGB'))

# 帧3: 手指按下 + 涟漪
frame3 = Image.new('RGB', (width, height), (240, 240, 240))
frame3_rgba = frame3.convert('RGBA')
# 先画涟漪
frame3_rgba.paste(ripple_enhanced, (ripple_x, ripple_y), ripple_enhanced)
# 再画手指
frame3_rgba.paste(finger_img, (finger_x, finger_end_y), finger_img)
frames.append(frame3_rgba.convert('RGB'))

# 保存为GIF
frames[0].save('finger_tap_simple.gif',
               save_all=True,
               append_images=frames[1:],
               duration=500,  # 每帧500毫秒
               loop=0)

print("简单GIF已生成: finger_tap_simple.gif")

# 同时保存各个帧为PNG以便检查
for i, frame in enumerate(frames):
    frame.save(f'frame_{i+1}.png')
    print(f"帧 {i+1} 已保存: frame_{i+1}.png")