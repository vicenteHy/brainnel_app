#!/usr/bin/env python3
from PIL import Image

# 加载图片
finger_img = Image.open('图层 3.png').convert('RGBA')
ripple_img = Image.open('组 1.png').convert('RGBA')

# 获取图片尺寸 - 增加画布大小确保动画不会出界
width = max(finger_img.width, ripple_img.width) + 100
height = max(finger_img.height, ripple_img.height) + 100

# 创建帧列表
frames = []
total_frames = 20  # 总帧数

# 手指按下动画参数
finger_start_y = 20  # 手指起始位置（画面顶部）
finger_end_y = height // 3  # 手指结束位置（上三分之一处）
finger_x = width // 2 - finger_img.width // 2  # 手指水平位置（居中）

# 涟漪动画参数 - 调整到手指尖端位置
ripple_base_x = finger_x + finger_img.width // 2 - ripple_img.width // 2
ripple_base_y = finger_end_y + int(finger_img.height * 0.8)  # 在手指底部附近

for frame_num in range(total_frames):
    # 创建透明背景
    frame = Image.new('RGBA', (width, height), (255, 255, 255, 0))
    
    # 计算手指位置（前半段动画）
    if frame_num < total_frames // 2:
        # 手指下降
        progress = frame_num / (total_frames // 2)
        finger_y = int(finger_start_y + (finger_end_y - finger_start_y) * progress)
        frame.paste(finger_img, (finger_x, finger_y), finger_img)
    else:
        # 手指保持在按下位置
        frame.paste(finger_img, (finger_x, finger_end_y), finger_img)
        
        # 涟漪效果（后半段动画）
        ripple_progress = (frame_num - total_frames // 2) / (total_frames // 2)
        
        # 创建涟漪图片的副本
        ripple_copy = ripple_img.copy()
        
        # 调整涟漪的透明度（从完全不透明到完全透明）
        alpha = int(255 * (1 - ripple_progress))
        
        # 调整涟漪大小（从小到大）
        scale = 0.3 + ripple_progress * 0.7  # 缩小涟漪的最大尺寸
        new_size = (int(ripple_img.width * scale), int(ripple_img.height * scale))
        ripple_scaled = ripple_copy.resize(new_size, Image.Resampling.LANCZOS)
        
        # 获取涟漪的 alpha 通道并调整透明度
        if ripple_scaled.mode == 'RGBA':
            r, g, b, a = ripple_scaled.split()
            a = a.point(lambda p: min(p, alpha))
            ripple_scaled = Image.merge('RGBA', (r, g, b, a))
        
        # 计算涟漪位置（基于手指位置）
        ripple_pos_x = ripple_base_x + ripple_img.width // 2 - new_size[0] // 2
        ripple_pos_y = ripple_base_y + ripple_img.height // 2 - new_size[1] // 2
        
        # 先粘贴涟漪，再粘贴手指（确保手指在上层）
        frame.paste(ripple_scaled, (ripple_pos_x, ripple_pos_y), ripple_scaled)
        frame.paste(finger_img, (finger_x, finger_end_y), finger_img)
    
    # 转换为RGB模式（GIF不支持透明度）
    # 使用深色背景让半透明的涟漪更明显
    rgb_frame = Image.new('RGB', (width, height), (50, 50, 50))  # 深灰色背景
    rgb_frame.paste(frame, (0, 0), frame)
    frames.append(rgb_frame)

# 添加反向播放的帧（让动画循环更自然）
frames.extend(frames[::-1])

# 保存为GIF
frames[0].save('finger_tap.gif', 
               save_all=True, 
               append_images=frames[1:], 
               duration=50,  # 每帧50毫秒
               loop=0)  # 无限循环

print("GIF动画已生成: finger_tap.gif")