# AI Agent Stats Dashboard

A dashboard for visualizing and analyzing Claude AI Agent usage statistics.

## Features

- 📊 **Overview Statistics** - View key metrics including sessions, messages, and tool calls
- 📈 **Trend Analysis** - Track daily activity trends and model usage distribution
- 🗂️ **Project Overview** - View usage statistics by project
- 🔧 **Plugin Management** - View installed plugins and marketplace
- 🌐 **MCP Servers** - Manage Model Context Protocol servers
- 📋 **Plan Tracking** - View and manage plans
- ⚡ **Skills Browser** - Browse available skills and their usage
- 🔍 **Debug Logs** - View application debug logs
- ⚙️ **Settings Management** - Configure environment variables, plugins, permissions with JSON view for other settings
- 🎨 **Responsive Design** - Support for desktop, tablet, and mobile devices
- 🌙 **Dark Mode** - Toggle between light and dark themes

## Getting Started

### Prerequisites

- Node.js 18+
- Claude AI Agent installed and configured (data stored in `~/.claude` directory)

### Installation

```bash
npm install
```

### Development

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the dashboard.

### Build

Production build:

```bash
npm run build
npm start
```

## Testing

Run E2E tests:

```bash
# Run tests
npm test

# UI mode
npm run test:ui

# Show browser
npm run test:headed

# Debug mode
npm run test:debug

# View test report
npm run test:report
```

## Available Pages

| Page | Path | Description |
|------|------|-------------|
| Dashboard | `/` | Overview statistics and trend charts |
| Skills | `/skills` | List of available skills |
| Plugins | `/plugins` | Installed plugins |
| MCP | `/mcp` | MCP server configuration |
| Projects | `/projects` | Detailed statistics for all projects |
| Debug | `/debug` | Application debug logs |
| Settings | `/settings` | Application settings (environment variables, plugins, permissions, etc.) |

## Tech Stack

- **Next.js 16** - React framework
- **React 19** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling framework
- **Recharts** - Chart library

## Configuration

The application automatically reads Claude AI data from the `~/.claude` directory. Ensure this directory exists and the application has access permissions.

## License

MIT
