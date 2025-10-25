# Flux Gravity - Frontend

![Flux.png](flux_banner.png)

Flux Gravity is available on domains, load balancing the entire Flux network:

[Flux Home](https://home.runonflux.io)

[API Documentation](https://docs.runonflux.com)

[Source Code Documentation](https://source.runonflux.io)

## About Flux Gravity Frontend

Flux Gravity Frontend is a modern Vue.js 3 application that provides the user interface for the Flux Network. It enables users to:

- **Manage Flux Nodes** - Monitor and control Flux nodes through an intuitive web interface
- **Deploy Applications** - Browse and deploy applications from the Flux Marketplace
- **Access FluxDrive** - Decentralized file storage and sharing
- **Monitor Network** - View real-time network statistics and node information
- **xDAO Integration** - Participate in decentralized governance
- **Cost Calculator** - Estimate deployment costs for applications

This is the **frontend-only** repository. For the backend API, see the main [Flux repository](https://github.com/runonflux/flux).

## Technology Stack

- **Vue 3** - Progressive JavaScript framework with Composition API
- **Vite** - Next-generation frontend build tool
- **Vuetify 3** - Material Design component framework
- **Pinia** - State management
- **Vue Router** - Client-side routing with file-based routing (unplugin-vue-router)
- **Axios** - HTTP client
- **Firebase** - Authentication and real-time features
- **Monaco Editor** - Code editor integration
- **Web3 Integration** - MetaMask SDK, Reown AppKit (WalletConnect) for blockchain interactions

## Key Features

### Marketplace
- Browse applications and games
- Deploy WordPress sites
- One-click application deployment
- Manage subscriptions

### FluxDrive
- Decentralized file storage
- File sharing and management
- IPFS integration

### Node Management
- Real-time node status
- Performance monitoring
- Update management

### xDAO
- Decentralized governance
- Proposal voting
- Community features

## Prerequisites

- **Node.js** 22.12.0+ (required by Vite 7)
- **npm** 9 or higher
- Modern web browser

## Quick Start

### Installation

```bash
# Clone the repository
git clone https://github.com/runonflux/fluxos-frontend
cd fluxos-frontend

# Install dependencies
npm install
```

### Development

```bash
# Start development server with hot reload
npm run dev
```

The application will be available at `http://localhost:3000` (or next available port)

### Building for Production

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

### Other Commands

```bash
# Lint and fix code
npm run lint

# Build iconify icons
npm run build:icons

# Fix nested lockfile dependencies
npm run fix-lockfile
```

## Project Structure

```
fluxos-frontend/
├── public/           # Static assets
├── src/
│   ├── @core/       # Core components and utilities
│   ├── @layouts/    # Layout components
│   ├── assets/      # Images, fonts, styles
│   ├── components/  # Reusable Vue components
│   ├── pages/       # File-based routing pages
│   ├── plugins/     # Vue plugins (Vuetify, i18n, etc.)
│   ├── services/    # API services
│   ├── stores/      # Pinia stores
│   └── utils/       # Helper functions
├── patches/         # npm package patches
├── scripts/         # Build and maintenance scripts
└── vite.config.js   # Vite configuration
```

## API Integration

This frontend communicates with the Flux backend API. The backend handles:

- Node communication (fluxd, fluxbenchd)
- Application deployment and management
- Authentication and authorization
- Database operations (MongoDB)
- Docker container management

For backend setup, refer to the [main Flux repository](https://github.com/runonflux/flux).

## Security

### Vulnerability Management

This project uses several tools to manage dependencies securely:

- **patch-package** - Patches vulnerable nested dependencies
- **npm overrides** - Forces specific package versions
- **Automated scripts** - Post-install scripts fix known vulnerabilities

Current security status:
- ✅ All critical and high severity vulnerabilities patched
- ✅ Moderate vulnerabilities (dompurify) fixed with automated scripts
- ✅ Migrated to Reown AppKit (WalletConnect successor)

### Patches Applied

- `monaco-editor` - dompurify vulnerability fix

Patches are automatically applied during `npm install`.

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Opera (latest)

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Development Guidelines

- Follow Vue 3 Composition API patterns
- Follow ESLint rules (`npm run lint`)
- Test thoroughly before submitting PRs
- Keep components small and reusable

## Troubleshooting

### Port already in use
```bash
# Vite will automatically try the next available port
# Or specify a port manually:
npm run dev -- --port 3001
```

### Module not found errors
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Build failures
```bash
# Check Node.js version
node --version  # Should be 22.12.0+

# Clear cache and rebuild
npm cache clean --force
npm install
npm run build
```

## License

This application is open source and distributed under the **GNU AGPLv3** license.

## Links

- [Flux Website](https://runonflux.io)
- [Flux Documentation](https://docs.runonflux.com)
- [Flux Discord](https://discord.gg/runonflux)
- [Flux GitHub](https://github.com/runonflux)
- [Backend Repository](https://github.com/runonflux/flux)

## Support

For support:
- Join our [Discord](https://discord.gg/runonflux)
- Open an issue on [GitHub](https://github.com/runonflux/fluxos-frontend/issues)
- Visit [Flux Documentation](https://docs.runonflux.com)

---

Made with ❤️ by the Flux Team
