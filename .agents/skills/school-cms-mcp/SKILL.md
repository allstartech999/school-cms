---
name: school-cms-mcp
description: >-
  Use this skill to interact with the School CMS MCP Server on Production (www.ppks.ac.th)
  or Local environment using the agent key ppk_agent_495e1798e8f89459ec2fe9298a8adbf26c7920e4.
  Enables managing site settings, SEO metadata, news posts, page layouts, navigation menus, and media.
---

# School CMS MCP Server & Agent Skill

Use this skill whenever you need to interact with the School CMS platform for **โรงเรียนโพนงามพิทยานุกูล (www.ppks.ac.th)** via its MCP (Model Context Protocol) Server or AI Agent REST endpoints.

---

## 🔑 Authentication Credentials & Endpoints

| Parameter | Production | Local Development |
| :--- | :--- | :--- |
| **Domain / Base URL** | `https://www.ppks.ac.th` | `http://localhost:8080` |
| **Agent API Key** | `ppk_agent_495e1798e8f89459ec2fe9298a8adbf26c7920e4` | `ppk_agent_495e1798e8f89459ec2fe9298a8adbf26c7920e4` |
| **Header Name** | `X-Agent-Key` | `X-Agent-Key` |
| **MCP SSE Endpoint** | `GET https://www.ppks.ac.th/mcp/sse` | `GET http://localhost:8080/mcp/sse` |
| **MCP Message Endpoint** | `POST https://www.ppks.ac.th/mcp/messages?sessionId=<session>` | `POST http://localhost:8080/mcp/messages?sessionId=<session>` |
| **Agent REST Endpoint** | `https://www.ppks.ac.th/api/v1/agent/posts` | `http://localhost:8080/api/v1/agent/posts` |

> [!IMPORTANT]
> Always pass `X-Agent-Key: ppk_agent_495e1798e8f89459ec2fe9298a8adbf26c7920e4` in HTTP headers.
> When connecting to `https://www.ppks.ac.th` via Python or curl, include a standard `User-Agent` (e.g. `Mozilla/5.0 ...`) to bypass Cloudflare bot restrictions.

---

## 🛠️ Available MCP Tools

### 1. Site Identity & SEO Management
- **`get_site_settings`**: Fetch school name, logo URL, favicon URL, SEO title, description, keywords, og_default_image, and Google verification token.
  - Arguments: None `{}`
- **`update_site_settings`**: Update school identity and SEO parameters.
  - Arguments:
    - `school_name` (string): Thai school name (e.g. `โรงเรียนโพนงามพิทยานุกูล`)
    - `school_name_en` (string): English school name (e.g. `Phon-ngam Pittayanukun School`)
    - `school_subtitle` (string): Affiliation/Subtitle (e.g. `สำนักงานเขตพื้นที่การศึกษามัธยมศึกษาจังหวัดมหาสารคาม`)
    - `logo_url` (string): School emblem URL (e.g. `/images/ppk-emblem-2d.png`)
    - `favicon_url` (string): Browser favicon URL
    - `seo_title` (string): Meta title for search engines
    - `seo_description` (string): Meta description for search engines and social share
    - `seo_keywords` (string): Comma-separated search keywords
    - `og_default_image` (string): Open Graph preview image URL (e.g. `https://www.ppks.ac.th/images/hero-banner.jpg`)
    - `google_site_verification` (string): Google Search Console verification token

### 2. Posts & News Management
- **`list_recent_posts`**: List latest school posts.
  - Arguments: `limit` (int, default 10), `category` (optional), `status` (`published` or `draft`)
- **`get_school_post`**: Get post details by ID or slug.
  - Arguments: `id_or_slug` (string or int, required)
- **`create_school_post`**: Publish or draft a new post.
  - Arguments: `title` (required), `content` (required), `category`, `summary`, `image_url`, `status` (`published` / `draft`)
- **`update_school_post`**: Edit an existing post.
  - Arguments: `id_or_slug` (required), `title`, `content`, `category`, `summary`, `image_url`, `status`
- **`delete_school_post`**: Delete a post.
  - Arguments: `id_or_slug` (required)

### 3. Dynamic Page Layouts (WordPress Gutenberg Block Style)
- **`list_pages`**: List all dynamic custom pages.
- **`get_page`**: Get full page layout and blocks by slug or ID.
  - Arguments: `slug_or_id` (required)
- **`create_or_update_page`**: Create or edit block pages.
  - Arguments: `title` (required), `slug` (required), `content`, `blocks_json` (stringified block JSON), `status`, `show_in_menu`, `show_in_bottom_nav`
- **`delete_page`**: Delete a dynamic page.
  - Arguments: `slug_or_id` (required)

### 4. Homepage & Navigation Menu
- **`get_homepage_config`**: Get current homepage layout blocks and component configs.
- **`update_homepage_config`**: Update homepage layout blocks and configuration.
  - Arguments: `blocks_json` (stringified JSON)
- **`manage_navigation_menu`**: Manage header navigation menu.
  - Arguments: `action` (`get`, `move_item`, `add_page`, `remove_page`, `set_menu`, `reset`), `item_id`, `parent`, `slug`, `menu_json`

### 5. Media Management
- **`upload_media_by_url`**: Fetch an external image from `source_url`, store it in the school's `/uploads/` repository, and return a permanent internal URL.
  - Arguments: `source_url` (required)
- **`list_media`**: List uploaded media assets.
  - Arguments: `limit` (default 20), `offset` (default 0)

---

## 💻 CLI Helper Script Usage

A pre-configured Python helper script is bundled in `scripts/client.py`:

```bash
# 1. Read Site Settings from Production
python3 ~/.gemini/config/skills/school-cms-mcp/scripts/client.py get_site_settings

# 2. Update SEO / Settings on Production
python3 ~/.gemini/config/skills/school-cms-mcp/scripts/client.py update_site_settings '{
  "seo_title": "โรงเรียนโพนงามพิทยานุกูล – สำนักงานเขตพื้นที่การศึกษามัธยมศึกษาจังหวัดมหาสารคาม",
  "seo_description": "เว็บไซต์อย่างเป็นทางการของโรงเรียนโพนงามพิทยานุกูล",
  "og_default_image": "https://www.ppks.ac.th/images/hero-banner.jpg"
}'

# 3. List Latest Posts from Production
python3 ~/.gemini/config/skills/school-cms-mcp/scripts/client.py list_recent_posts '{"limit": 5}'

# 4. Target Local Development Environment
python3 ~/.gemini/config/skills/school-cms-mcp/scripts/client.py --local get_site_settings
```
