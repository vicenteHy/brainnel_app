#!/usr/bin/env python3
from PIL import Image

# 加载图片
finger_img = Image.open('图层 3.png').convert('RGBA')
ripple_img = Image.open('组 1.png').convert('RGBA')

# 设置画布大小
width = 400
height = 400

# 创建帧列表
frames = []
total_frames = 30  # 增加总帧数

# 手指按下动画参数
finger_start_y = 50
finger_end_y = 150
finger_x = (width - finger_img.width) // 2

# 涟漪位置（固定在手指下方）
ripple_center_x = width // 2
ripple_center_y = finger_end_y + finger_img.height - 20

for frame_num in range(total_frames):
    # 创建白色背景
    frame = Image.new('RGBA', (width, height), (255, 255, 255, 255))
    
    # 计算手指位置（前三分之一时间下降）
    if frame_num < total_frames // 3:
        progress = frame_num / (total_frames // 3)
        finger_y = int(finger_start_y + (finger_end_y - finger_start_y) * progress)
    else:
        finger_y = finger_end_y
    
    # 如果手指已经按下，显示涟漪
    if frame_num >= total_frames // 3:
        # 计算涟漪动画进度
        ripple_progress = (frame_num - total_frames // 3) / (total_frames * 2 // 3)
        
        # 涟漪透明度（从不透明到透明）
        alpha = int(200 * (1 - ripple_progress))
        
        # 涟漪大小（从小到大）
        scale = 0.5 + ripple_progress * 2.0
        new_width = int(ripple_img.width * scale)
        new_height = int(ripple_img.height * scale)
        
        # 调整涟漪大小
        ripple_scaled = ripple_img.resize((new_width, new_height), Image.Resampling.LANCZOS)
        
        # 调整涟漪透明度
        if ripple_scaled.mode == 'RGBA':
            r, g, b, a = ripple_scaled.split()
            # 应用新的透明度
            a = a.point(lambda p: int(p * alpha / 255))
            ripple_scaled = Image.merge('RGBA', (r, g, b, a))
        
        # 计算涟漪位置（保持中心不变）
        ripple_x = ripple_center_x - new_width // 2
        ripple_y = ripple_center_y - new_height // 2
        
        # 粘贴涟漪
        frame.paste(ripple_scaled, (ripple_x, ripple_y), ripple_scaled)
    
    # 粘贴手指（手指始终在最上层）
    frame.paste(finger_img, (finger_x, finger_y), finger_img)
    
    # 转换为RGB模式
    rgb_frame = frame.convert('RGB')
    frames.append(rgb_frame)

# 保存为GIF（不反向播放，让动画更流畅）
frames[0].save('finger_tap_v2.gif', 
               save_all=True, 
               append_images=frames[1:], 
               duration=50,
               loop=0)

print("GIF动画已生成: finger_tap_v2.gif")