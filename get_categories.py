#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import mysql.connector
import json

# 数据库配置
DB_CONFIG = {
    'host': '13.245.224.109',
    'user': 'root',
    'password': 'Kajx5gtk3Y1GzQA55wez',
    'database': 'product_db',
    'port': 3307
}

def get_categories():
    """获取所有分类的ID、英文名和法语名"""
    try:
        # 连接数据库
        connection = mysql.connector.connect(**DB_CONFIG)
        cursor = connection.cursor()
        
        # 查询所有分类
        query = "SELECT category_id, name_en, name_fr FROM ali_category ORDER BY category_id"
        cursor.execute(query)
        
        # 获取结果
        results = cursor.fetchall()
        
        # 格式化数据
        categories = []
        for row in results:
            category = {
                'category_id': row[0],
                'name_en': row[1],
                'name_fr': row[2]
            }
            categories.append(category)
        
        return categories
        
    except mysql.connector.Error as error:
        print(f"数据库连接错误: {error}")
        return None
        
    finally:
        if connection.is_connected():
            cursor.close()
            connection.close()

def main():
    """主函数"""
    print("正在获取分类数据...")
    
    categories = get_categories()
    
    if categories:
        print(f"成功获取 {len(categories)} 个分类")
        
        # 保存到JSON文件
        with open('categories.json', 'w', encoding='utf-8') as f:
            json.dump(categories, f, ensure_ascii=False, indent=2)
        
        print("数据已保存到 categories.json 文件")
        
        # 显示前10条数据作为示例
        print("\n前10条分类数据:")
        for i, category in enumerate(categories[:10]):
            print(f"{i+1}. ID: {category['category_id']}, 英文: {category['name_en']}, 法语: {category['name_fr']}")
        
        if len(categories) > 10:
            print(f"... 还有 {len(categories) - 10} 条数据")
    else:
        print("获取分类数据失败")

if __name__ == "__main__":
    main()