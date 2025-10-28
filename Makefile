.PHONY: help dev prod patch minor major

# 颜色定义
GREEN=\033[0;32m
YELLOW=\033[1;33m
NC=\033[0m # No Color

# 文件路径
APP_JSON=app.json
IOS_PLIST=ios/brainnel/Info.plist
ANDROID_GRADLE=android/app/build.gradle
CONFIG_FILE=app/constants/config.ts

help:
	@echo "$(GREEN)可用命令:$(NC)"
	@echo "  $(YELLOW)make patch$(NC)   - 版本号+0.0.1 (5.7.1 -> 5.7.2)"
	@echo "  $(YELLOW)make minor$(NC)   - 版本号+0.1.0 (5.7.1 -> 5.8.0)"
	@echo "  $(YELLOW)make major$(NC)   - 版本号+1.0.0 (5.7.1 -> 6.0.0)"
	@echo "  $(YELLOW)make dev$(NC)     - 切换开发环境"
	@echo "  $(YELLOW)make prod$(NC)    - 切换生产环境"

patch:
	@$(MAKE) bump-version TYPE=patch

minor:
	@$(MAKE) bump-version TYPE=minor

major:
	@$(MAKE) bump-version TYPE=major

bump-version:
	@if [ -z "$(TYPE)" ]; then \
		echo "$(YELLOW)错误: 请指定版本类型$(NC)"; \
		exit 1; \
	fi
	@echo "$(GREEN)开始更新版本号...$(NC)"
	@node -e " \
		const fs = require('fs'); \
		const type = '$(TYPE)'; \
		\
		// 读取 app.json \
		const appJson = JSON.parse(fs.readFileSync('$(APP_JSON)', 'utf8')); \
		const currentVersion = appJson.expo.version; \
		const currentBuild = parseInt(appJson.expo.ios.buildNumber); \
		\
		// 计算新版本 \
		const parts = currentVersion.split('.').map(Number); \
		if (type === 'major') { \
			parts[0]++; parts[1] = 0; parts[2] = 0; \
		} else if (type === 'minor') { \
			parts[1]++; parts[2] = 0; \
		} else if (type === 'patch') { \
			parts[2]++; \
		} \
		const newVersion = parts.join('.'); \
		const newBuild = currentBuild + 1; \
		\
		console.log('旧版本:', currentVersion, '(Build:', currentBuild + ')'); \
		console.log('新版本:', newVersion, '(Build:', newBuild + ')'); \
		\
		// 更新 app.json \
		appJson.expo.version = newVersion; \
		appJson.expo.ios.buildNumber = newBuild.toString(); \
		fs.writeFileSync('$(APP_JSON)', JSON.stringify(appJson, null, 2)); \
		\
		// 更新 Info.plist \
		let plist = fs.readFileSync('$(IOS_PLIST)', 'utf8'); \
		plist = plist.replace(/<key>CFBundleShortVersionString<\/key>\s*<string>[^<]+<\/string>/, \
			'<key>CFBundleShortVersionString</key>\\n    <string>' + newVersion + '</string>'); \
		plist = plist.replace(/<key>CFBundleVersion<\/key>\s*<string>[^<]+<\/string>/, \
			'<key>CFBundleVersion</key>\\n    <string>' + newBuild + '</string>'); \
		fs.writeFileSync('$(IOS_PLIST)', plist); \
		\
		// 更新 build.gradle \
		let gradle = fs.readFileSync('$(ANDROID_GRADLE)', 'utf8'); \
		gradle = gradle.replace(/versionCode \d+/, 'versionCode ' + newBuild); \
		gradle = gradle.replace(/versionName \"[^\"]+\"/, 'versionName \"' + newVersion + '\"'); \
		fs.writeFileSync('$(ANDROID_GRADLE)', gradle); \
		\
		console.log('✅ 版本更新完成!'); \
	"

dev:
	@sed -i.bak 's/const IS_PRODUCTION = true/const IS_PRODUCTION = false/' $(CONFIG_FILE) || \
	 sed -i.bak 's/const IS_PRODUCTION = false/const IS_PRODUCTION = false/' $(CONFIG_FILE)
	@rm -f $(CONFIG_FILE).bak
	@echo "$(GREEN)✅ 已切换到开发环境 (测试服务器)$(NC)"

prod:
	@sed -i.bak 's/const IS_PRODUCTION = false/const IS_PRODUCTION = true/' $(CONFIG_FILE) || \
	 sed -i.bak 's/const IS_PRODUCTION = true/const IS_PRODUCTION = true/' $(CONFIG_FILE)
	@rm -f $(CONFIG_FILE).bak
	@echo "$(GREEN)✅ 已切换到生产环境 (正式服务器)$(NC)"
