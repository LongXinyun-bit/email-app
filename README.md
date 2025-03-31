# Email Client Web Application

一个使用Django和JavaScript构建的单页面邮件客户端应用程序。

## 功能特点

- 单页面应用，无页面刷新
- 发送和接收邮件
- 查看邮件详情
- 回复邮件功能
- 存档/取消存档邮件
- 左滑删除邮件(移动设备友好)

## 技术栈

- **后端**: Django
- **前端**: JavaScript, HTML, CSS
- **API**: RESTful API
- **数据库**: SQLite (默认)

## 快速开始

```bash
# 克隆仓库
git clone https://github.com/你的用户名/mail-client.git
cd mail-client

# 安装Django
pip install django

# 运行项目
cd mail_project/mail
python manage.py migrate
python manage.py runserver
```

访问 http://127.0.0.1:8090 开始使用

## 使用说明

1. 注册账户并登录
2. 使用"Compose"按钮撰写新邮件（收件人必须是系统内用户）
3. 点击邮件查看详情，可以回复或存档
4. 左滑邮件显示删除按钮

## 注意事项

- 这是一个封闭系统，只能在系统内部用户之间发送邮件
- 仅用于学习和演示目的


## 许可证

MIT License
