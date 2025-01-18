# Installation Guide

## System Requirements

### Hardware Requirements
- CPU: 2+ cores
- RAM: 4GB minimum, 8GB recommended
- Storage: 20GB minimum free space
- Network: Stable internet connection

### Software Requirements
- Operating System:
  - Windows 10/11
  - macOS 10.15+
  - Ubuntu 20.04+
- Node.js 18.x or later
- PostgreSQL 14.x or later
- Git
- npm or yarn

## Installation Steps

### 1. Database Setup

#### PostgreSQL Installation
Windows:
```bash
# Download and run installer from postgresql.org
# Or use chocolatey
choco install postgresql
```

macOS:
```bash
# Using Homebrew
brew install postgresql
brew services start postgresql
```

Ubuntu:
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

#### Database Creation
```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE bulk_buyer_db;

# Create user
CREATE USER bulk_buyer_user WITH ENCRYPTED PASSWORD 'your_password';

# Grant privileges
GRANT ALL PRIVILEGES ON DATABASE bulk_buyer_db TO bulk_buyer_user;
```

### 2. Node.js Installation

Windows:
```bash
# Download and run installer from nodejs.org
# Or use chocolatey
choco install nodejs
```

macOS:
```bash
# Using Homebrew
brew install node
```

Ubuntu:
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### 3. Application Setup

#### Clone Repository
```bash
git clone https://github.com/your-org/bulk-buyer-group.git
cd bulk-buyer-group
```

#### Install Dependencies
```bash
npm install
# or
yarn install
```

#### Environment Configuration
```bash
# Copy example environment file
cp .env.example .env.local

# Edit .env.local with your settings
DATABASE_URL="postgresql://bulk_buyer_user:your_password@localhost:5432/bulk_buyer_db"
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"
```

#### Database Migration
```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev
```

### 4. Running the Application

#### Development Mode
```bash
npm run dev
# or
yarn dev
```

#### Production Mode
```bash
# Build the application
npm run build
# or
yarn build

# Start the server
npm start
# or
yarn start
```

## Configuration

### Environment Variables
```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/db_name"

# Authentication
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"

# Optional: Email (for notifications)
SMTP_HOST="smtp.example.com"
SMTP_PORT="587"
SMTP_USER="your-email"
SMTP_PASSWORD="your-password"

# Optional: S3 (for file storage)
AWS_ACCESS_KEY_ID="your-access-key"
AWS_SECRET_ACCESS_KEY="your-secret-key"
AWS_REGION="your-region"
AWS_BUCKET_NAME="your-bucket"
```

### Server Configuration
```javascript
// next.config.js
module.exports = {
  // Server settings
  serverRuntimeConfig: {
    // Will only be available on the server side
    mySecret: 'secret',
  },
  // Public settings
  publicRuntimeConfig: {
    // Will be available on both server and client
    staticFolder: '/static',
  },
}
```

## Deployment

### Local Deployment
1. Build the application
2. Configure environment
3. Start the server
4. Access via localhost

### Cloud Deployment

#### Vercel
1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Deploy:
```bash
vercel
```

#### Docker
1. Build image:
```bash
docker build -t bulk-buyer-group .
```

2. Run container:
```bash
docker run -p 3000:3000 bulk-buyer-group
```

## Security Setup

### SSL Configuration
1. Generate SSL certificate
2. Configure web server
3. Enable HTTPS
4. Redirect HTTP to HTTPS

### Firewall Rules
```bash
# Allow HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Allow PostgreSQL
sudo ufw allow 5432/tcp
```

## Monitoring Setup

### Application Monitoring
1. Install monitoring tools
2. Configure metrics
3. Set up alerts
4. Monitor logs

### Database Monitoring
1. Configure PostgreSQL logging
2. Set up backup system
3. Monitor performance
4. Configure alerts

## Troubleshooting

### Common Issues

#### Database Connection
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Check connection
psql -U bulk_buyer_user -d bulk_buyer_db -h localhost
```

#### Node.js Issues
```bash
# Check Node.js version
node --version

# Clear npm cache
npm cache clean --force
```

#### Build Issues
```bash
# Clear Next.js cache
rm -rf .next

# Rebuild
npm run build
```

### Error Logs
- Application logs: `logs/app.log`
- Error logs: `logs/error.log`
- Access logs: `logs/access.log`

## Maintenance

### Backup Procedures
1. Database backup:
```bash
pg_dump -U bulk_buyer_user bulk_buyer_db > backup.sql
```

2. Application backup:
```bash
tar -czf backup.tar.gz .
```

### Update Procedures
1. Stop application
2. Backup data
3. Pull updates
4. Install dependencies
5. Run migrations
6. Restart application

## Support

### Technical Support
- Email: tech-support@bulkbuyergroup.com
- Phone: 1-800-TECH-HELP
- Documentation: docs.bulkbuyergroup.com

### Resources
- GitHub Repository
- Documentation
- API Reference
- Community Forums 