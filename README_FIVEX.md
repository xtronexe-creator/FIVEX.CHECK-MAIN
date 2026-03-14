# FiveX.check - Professional FiveM & PC Security Scanner

A comprehensive security scanning system designed for FiveM communities. Detect suspicious files, malware, and unauthorized modifications with professional-grade analysis.

## Features

### Admin Panel
- 🔐 **Secure Code Generation**: Generate unique scan codes with expiration tracking
- 📊 **Real-time Dashboard**: Monitor all scans and threats
- 📋 **Detailed Results**: View comprehensive file analysis with metadata
- 🎯 **Risk Categorization**: Suspicious, Warning, Moderate, Safe classifications
- 📈 **Analytics**: Track threats and patterns over time
- 🔍 **Search & Filter**: Find specific scans and files quickly

### Desktop Scanner
- 🖥️ **Multi-location Scanning**: AppData, Downloads, FiveM, System folders
- ⚡ **Fast Scanning**: Efficient file analysis with progress tracking
- 🎮 **FiveM Detection**: Special analysis for FiveM mods and files
- 🔒 **Secure Authentication**: Code-based device authentication
- 📤 **Auto-submission**: Results automatically sent to server
- 🎨 **Gaming UI**: Professional dark-themed interface

### Backend
- 🔑 **tRPC API**: Type-safe backend procedures
- 🗄️ **MySQL Database**: Reliable data storage
- 🔐 **Authentication**: OAuth integration with admin controls
- 📝 **Audit Logging**: Complete scan history
- ⚙️ **Scalable**: Built for production deployment

## Quick Start

### 1. Install Dependencies
```bash
cd /home/ubuntu/fivex-check-web
pnpm install
```

### 2. Setup Database
```bash
pnpm db:push
```

### 3. Start Development Server
```bash
pnpm dev
```

### 4. Access Admin Panel
Open `http://localhost:3000` in your browser

### 5. Run Desktop Scanner
```bash
python FiveXCheck_Scanner.py
```

## Project Structure

```
fivex-check-web/
├── client/                 # React frontend
│   ├── src/
│   │   ├── pages/         # Admin panel pages
│   │   ├── components/    # Reusable UI components
│   │   └── lib/           # tRPC client setup
│   └── public/            # Static assets
├── server/                # Node.js backend
│   ├── routers.ts         # tRPC procedures
│   ├── db.ts              # Database helpers
│   └── _core/             # Framework setup
├── drizzle/               # Database schema
│   └── schema.ts          # Table definitions
├── FiveXCheck_Scanner.py  # Desktop scanner app
├── SETUP_GUIDE.md         # Detailed setup instructions
└── package.json           # Dependencies
```

## Admin Panel Pages

### Home Dashboard
- Welcome message
- Quick access to main features
- System status overview

### Scan Codes Manager (`/codes`)
- Generate new scan codes
- Set expiration time (1-720 hours)
- View all codes with status
- Copy codes to clipboard
- Track usage and expiration

### Scan Results Viewer (`/results`)
- List of all scans
- Search by device name
- Detailed scan information
- File categorization
- Risk level indicators
- File metadata display

## Desktop Scanner Features

### Authentication
- Enter scan code from admin panel
- Automatic device name detection
- Secure code validation

### Scan Locations
- **AppData & Local**: User profile data
- **Downloads**: Download folder
- **FiveM Directory**: FiveM installation
- **System Folders**: Windows system files

### Detection Categories
- **Suspicious**: Malware indicators, dangerous keywords
- **Warning**: Executables, system modifications
- **Moderate**: Large files, unusual locations
- **Safe**: Normal system files

### Results
- Real-time progress tracking
- Detailed file information
- Automatic server submission
- Scan history

## API Endpoints

### Public Endpoints
```
POST /api/trpc/scanCode.validate
POST /api/trpc/scanResult.create
POST /api/trpc/scanResult.addFiles
POST /api/trpc/scanResult.updateStatus
```

### Admin Endpoints
```
POST /api/trpc/scanCode.generate
GET /api/trpc/scanCode.list
GET /api/trpc/scanResult.list
GET /api/trpc/scanResult.getWithFiles
```

## Database Schema

### scan_codes
Stores generated scan codes for device authentication

### scan_results
Stores scan session information and statistics

### scan_files
Stores individual file detections with metadata

## Configuration

### Environment Variables
```
DATABASE_URL=mysql://user:pass@host/db
JWT_SECRET=your_secret_key
VITE_APP_ID=your_app_id
OAUTH_SERVER_URL=https://api.manus.im
```

### Scanner Configuration
Edit `FiveXCheck_Scanner.py`:
- `API_BASE_URL`: Backend API endpoint
- `SUSPICIOUS_PATTERNS`: File patterns to detect
- `DANGEROUS_KEYWORDS`: Keywords indicating threats

## Deployment

### Docker
```bash
docker build -t fivex-check .
docker run -p 3000:3000 -e DATABASE_URL=<url> fivex-check
```

### Production
1. Build frontend: `pnpm build`
2. Build backend: `pnpm build`
3. Set environment variables
4. Run: `pnpm start`

## Security Features

- ✅ Code-based authentication
- ✅ JWT session tokens
- ✅ Admin-only operations
- ✅ Encrypted data transmission
- ✅ Audit logging
- ✅ Input validation
- ✅ Rate limiting ready
- ✅ HTTPS support

## Performance

- ⚡ Fast file scanning
- 📊 Real-time progress
- 🔄 Efficient database queries
- 💾 Optimized storage
- 🚀 Scalable architecture

## Troubleshooting

### Scanner Won't Connect
- Check internet connection
- Verify backend is running
- Confirm API URL is correct

### Code Validation Fails
- Verify code is correct
- Check code hasn't expired
- Ensure code hasn't been used

### Database Error
- Check MySQL is running
- Verify DATABASE_URL
- Check credentials

## System Requirements

### Admin Panel
- Modern web browser (Chrome, Firefox, Edge)
- Internet connection
- 100MB disk space

### Desktop Scanner
- Windows 10/11 (64-bit)
- Python 3.8+
- 100MB free disk space
- Internet connection

### Backend
- Node.js 18+
- MySQL 5.7+
- 500MB disk space

## Support

For issues or questions:
1. Check SETUP_GUIDE.md
2. Review logs in `.manus-logs/`
3. Verify all prerequisites
4. Test API endpoints

## License

Proprietary - FiveX.check System

## Version

**FiveX.check v1.0.0**
- Release Date: March 2026
- Status: Production Ready

---

**Professional Gaming Security | FiveM Protection | PC Scanning**

For more information, see SETUP_GUIDE.md
