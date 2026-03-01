# Pages CMS Setup Guide

## Overview

This site is configured for Pages CMS with:

- Config: `.pages.yml`
- Content file: `content/site.json`
- Admin helper page: `admin/index.html` (links to `https://app.pagescms.org/`)

## Quick Start

1. Open `https://app.pagescms.org/`
2. Sign in with GitHub
3. Select repository `rachelmariehannon.com`
4. Open **Site Content**
5. Edit fields and click **Save**

## Content Model

Top-level fields:

- `title`
- `subtitle`
- `author`
- `socials` (platform + URL)
- `sections` (block list)

Supported section block types:

- `text`
- `quote`
- `list`
- `two-column`
- `substack`
- `events`

## Events Model

Event entries use a single datetime field:

- `starts_at` (date + time)
- `venue`
- `city`
- optional: `details`, `link`, `place_id`, `google_maps_url`

Notes:

- Dates/times are filtered on the frontend to show upcoming events.
- Link fields have validation patterns in `.pages.yml`.

Text block note:

- `text.content` is a single multiline field.
- Use a blank line to create a new paragraph.

## Editing Tips

- Leave optional fields blank if you do not need them.
- Reorder list items with the drag handle.
- Save writes changes to GitHub; the site updates after deployment.

## References

- Docs: https://pagescms.org/docs/
- Configuration: https://pagescms.org/docs/configuration/
- Date field: https://pagescms.org/docs/configuration/date-field/
- GitHub: https://github.com/pages-cms/pages-cms
