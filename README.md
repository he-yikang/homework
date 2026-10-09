<div align="center">

# 🤖 人工智能概论 · 作业仓库

</div>

<table>
<tr>
<td width="30%"><b>姓名 / 学号</b></td>
<td>何奕康 / （待填写）</td>
</tr>
<tr>
<td><b>班级</b></td>
<td>人工智能概论</td>
</tr>
<tr>
<td><b>GitHub 用户名</b></td>
<td>he-yikang</td>
</tr>
<tr>
<td><b>在线站点</b></td>
<td><a href="https://he-yikang.github.io/homework/">he-yikang.github.io/homework</a></td>
</tr>
</table>

---

## 第 1 次作业：GitHub 注册 + 环境搭建

### 1. 任务

注册 GitHub 账号，创建仓库，并完成 Git 和 GitHub Desktop 的安装配置，学会用 AI 工具辅助完成编程相关的任务。

### 2. 我做了什么

我使用 **TRAE** AI 助手协助完成了整个环境搭建过程，具体包括：

- 安装了 **Git for Windows** v2.55.0
- 下载并安装了 **GitHub Desktop** v3.6.6，还安装了汉化包
- 注册了 GitHub 账号，用户名是 he-yikang
- 配置了 Git 全局信息（用户名和邮箱）
- 生成了 SSH 密钥并添加到 GitHub，实现免密推送
- 创建了本仓库，上传了三张 AI 编程作品的截图

<div align="center">
<img src="06548be0-b719-4ff5-b755-e80633d22d00.png" width="80%" alt="Python生成N阶幻方 - WorkBuddy">
<p><i>作品一：WorkBuddy 生成 N 阶幻方程序</i></p>
</div>

<div align="center">
<img src="2480c9c1d343a7bb8d057bb967a9db6a.png" width="80%" alt="1000以内质数生成器 - DeepSeek Codex">
<p><i>作品二：DeepSeek Codex 生成质数程序</i></p>
</div>

<div align="center">
<img src="675f3edf-5fd1-4e8e-81bc-6f9f31e01587.png" width="80%" alt="GitHub环境配置完成 - TRAE">
<p><i>作品三：TRAE 完成 GitHub 全流程配置</i></p>
</div>

### 3. 卡在哪

**我一开始以为**注册 GitHub 很简单，直接打开网站就能注册。**实际是**因为网络原因，GitHub 的注册页面从国内 IP 访问会返回 403 错误，需要用 VPN 才能访问。而且就算开了 VPN，如果节点是 AWS 这种数据中心 IP，GitHub 也会封禁注册入口，防止批量注册机器人。

后来发现换成住宅 IP 节点就可以了，或者用 Google 账号关联注册也能绕过 IP 限制。这个问题我卡了挺久，一开始以为是浏览器的问题，清了缓存、换了浏览器都不行，**才发现**原来是 IP 被 GitHub 风控了。

还有一个坑：SSH 连接有时候会超时，**原因是** VPN 的 22 端口可能被限制，换成 HTTPS 方式克隆推送就没问题了。

### 4. 分工

| 谁做的 | 做了什么 |
|:--|:--|
| **AI (TRAE)** | 自动下载安装 Git、GitHub Desktop、生成 SSH 密钥、写 HTML 页面、提交推送代码 |
| **AI (WorkBuddy)** | 生成幻方 Python 代码，自动校验各阶幻和是否正确 |
| **AI (DeepSeek Codex)** | 生成 1000 以内质数的 Python 程序 |
| **我自己** | 安装 VPN 工具、注册 GitHub 账号（人机验证得手动过）、**核对**代码运行结果、**判断** SSH 连不上是网络问题不是配置问题、**改**了 README 让内容更完整 |

AI 帮我省了很多查教程、敲命令的时间，但账号注册的人机验证、还有判断问题出在哪，还是得我自己来。我负责整体方向和结果验证，AI 负责具体执行。

### 5. 收获

最大的**收获**就是：用 AI 工具真的能大幅提高效率，以前装个 Git 配置环境要查半天教程，现在 AI 直接帮你一条命令搞定。

但也**学到了**，AI 不是万能的，遇到网络问题、账号验证这种涉及人机交互的事情，还是得自己上手。**下次**遇到注册失败的情况，我会先想到可能是 IP 的问题，而不是一味地刷新页面。

另外我也**验证了**一个想法：AI 写代码的能力确实很强，幻方、质数这种经典算法题，它一次就能写对，而且还能自己写校验程序来验证结果。以后写作业可以先用 AI 出初稿，我自己再调整和检查。

---

<div align="right">
<span style="color: #888">更新于 2026-10-09 · 由 AI 辅助完成</span>
</div>
