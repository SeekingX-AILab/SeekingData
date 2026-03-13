# 🤖 捕获月球大模型合成数据平台-公众号：正经人王同学
### 捕获月球大模型合成数据平台：致力于打造低成本的人人都懂用的多模态合成数据解决方案助力各类大模型的预训练、微调、gpto1(cot)、function calling等训练场景,欢迎加入我们或与我们合作！

在线体验地址：https://sft-data-builder.vercel.app
演示视频：[https://www.bilibili.com/video/BV1dvDQYBEew/?spm_id_from=333.999.0.0](https://www.bilibili.com/video/BV19qD6YqEJ2/?spm_id_from=333.999.0.0)

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Version](https://img.shields.io/badge/version-1.0.0-green.svg)
![React](https://img.shields.io/badge/React-18.x-61dafb.svg)
![image](https://github.com/user-attachments/assets/ffd1f820-dd6f-4d11-8411-0c12d6ba76ce)

<img width="861" alt="8d5400bce0635b5e236cba05e923c44" src="https://github.com/user-attachments/assets/531dee7e-949f-4fac-b646-06ab518f5612">
<img width="861" alt="0972de00f8afa29489cba138ecac6ac" src="https://github.com/user-attachments/assets/90202679-5a01-48a2-b80d-e6f1a06f910e">

<img width="954" alt="d5445bacd9f03810e326039f9653267" src="https://github.com/user-attachments/assets/8e49cc36-b5aa-419f-a748-141b94a27161">
<img width="954" alt="4570df76058f5bd3e996b4f6bdba9db" src="https://github.com/user-attachments/assets/a353a4ed-77e3-4c63-9948-5f6caabab764">


<img width="861" alt="a03d915893cfcec4a2ff76e8cf93fbb" src="https://github.com/user-attachments/assets/1fa622c1-3539-41fe-91a9-8d903ae013a8">
<img width="861" alt="cfb9e2c681df09534217d12fc79c1c3" src="https://github.com/user-attachments/assets/7e235e69-2dd1-4ee3-b9c6-7e7a6e1fc317">
![image](https://github.com/user-attachments/assets/c8c2ddf0-f3c6-4baf-9b81-ea21e7422ae9)


<img width="861" alt="1fb4e0bc5e6c94936a07184aec76ed6" src="https://github.com/user-attachments/assets/3a152963-d32f-4101-90a4-74e9b20ea1ea">
<img width="861" alt="63303795320f7f0f2410b405a367704" src="https://github.com/user-attachments/assets/eba5efed-39af-42ac-9288-c7a36c1c8377">

<img width="861" alt="2bfe538bbe133542a2235bfd4b90df9" src="https://github.com/user-attachments/assets/9862e5ed-61f3-472a-9802-9368d8d757e6">


<p align="center">
  <img src="docs/images/demo.gif" alt="演示" width="800">
</p>

## ✨ 特性

- 🎯 **一键生成训练数据**：支持众多openai格式调用的本地或云端模型（包括GLM-4-Flash等免费调用模型） 将普通文本秒变高质量AI训练数据 支持直接从微信公众号文章等链接内容生成训练数据
- 📝 **合成gpto1类的cot数据合成功能，且可同步上传至huggingface**
- 📤 **支持vison language model的sharegpt微调格式数据合成**
- 🔄 **批量生成**：一次生成多条不同角度的训练数据、支持批量url文章自动生成批量数据
- 📝 **灵活编辑**：所有生成的数据都可以随时编辑和调整
- 💾 **本地存储**：自动保存所有数据到本地
- 🔌 **上传合成数据到huggingface平台**：填好accesstoken和仓库等信息后 一键上传合成好的数据到huggingface平台存储或分享给他人
- 📤 **导出简单**：一键导出标准格式JSON文件
- 🎨 **优雅界面**：简洁直观的用户界面，操作便捷
- 🔌 **多模型支持**：支持多种主流AI模型，可自定义模型
- 📚 **多格式支持**：支持PDF、Word、TXT等多种文件格式
- 📚 **主流训练格式互换**：增加了 Alpaca训练格式与Openai训练格式互换功能 支持批量文件互换格式

## 📅 更新动态
### v1.1.4 (2024-11-24)
- ✨ 支持vison language model的sharegpt微调格式数据合成

### v1.1.3 (2024-11-22)
- ✨ 增加了合成gpto1类的cot数据合成功能，且可同步上传至huggingface


### v1.1.2 (2024-11-20)
- ✨ 增加了上传合成数据到huggingface平台：填好accesstoken和仓库等信息后 一键上传合成好的数据到huggingface平台存储或分享给他人

### v1.1.1 (2024-11-12)
- ✨ 增加了 Alpaca训练格式与Openai训练格式互换功能 支持批量文件互换格式
### v1.1.0 (2024-11-09)
- ✨ 新增支持批量url文章自动生成批量数据
- 🔧 优化了数据生成的速度
- 🐛优化界面

## 🚀 快速开始

### 安装依赖 
```bash
npm install
```
### 启动项目
```bash
npm run start
```

## 📖 使用指南

1. **配置API**
   - 点击"打开配置"按钮
   - 设置API地址和密钥
   - 选择或自定义AI模型
   - 设置每次生成的数据条数

2. **输入内容**
   - 上传文件（支持PDF、DOCX、TXT）
   - 或直接输入文本内容

3. **生成数据**
   - 点击"生成AI响应"按钮
   - 在多个生成结果中切换
   - 根据需要编辑生成的内容

4. **管理数据**
   - 添加到数据列表
   - 预览所有生成的数据
   - 删除不需要的数据
   - 导出为JSON文件

## 🎯 训练数据格式
json
{
"instruction": "用户指令",
"input": "用户输入（可选）",
"output": "AI回答",
"system": "系统提示词（可选）",
"history": [
["历史问题1", "历史回答1"],
["历史问题2", "历史回答2"]
]
}


## 🛠️ 技术栈

- ⚛️ React 18
- 🎨 TailwindCSS
- 📄 PDF.js
- 📝 Mammoth.js
- 💾 LocalStorage API

## 📋 待办功能

- [ ] 支持更多文件格式
- [ ] 添加数据验证功能
- [ ] 批量导入功能
- [ ] 数据标签系统
- [ ] 导出更多格式

## 🤝 贡献指南

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交改动 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 提交 Pull Request

## 📜 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 👨‍💻 作者

正经人王同学

- 微信公众号：正经人王同学
- 微信:whatisallineed
- GitHub：[https://github.com/zjrwtx](https://github.com/zjrwtx)
- Email：[3038880699@qq.com](mailto:3038880699@qq.com)

## 🌟 Star 历史

[![Star History Chart](https://api.star-history.com/svg?repos=zjrwtx/SFT-data-builder&type=Date)](https://star-history.com/#zjrwtx/SFT-data-builder&Date)


## 🙏 致谢
特别感谢以下开源项目和贡献者：
- [LaiWei魏来](https://github.com/waltonfuture) -提供算法指导等支持
- gpto1(cot)数据合成的参考来源 -https://github.com/HKAIR-Lab/HK-O1aw
- 所有提供反馈和建议的用户
  





---

如果这个项目对你有帮助，请给一个 ⭐️ 鼓励一下！
