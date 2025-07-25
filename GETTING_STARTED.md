# 🚀 Getting Started with Argus

Welcome to Argus Monitoring Platform! This guide will help you get up and running quickly.

## 📖 Table of Contents

1. [Quick Setup (Recommended)](#-quick-setup-recommended)
2. [What You'll Get](#-what-youll-get)
3. [First Steps After Setup](#-first-steps-after-setup)
4. [Understanding the Interface](#-understanding-the-interface)
5. [Adding Your Own Data](#-adding-your-own-data)
6. [Common Tasks](#-common-tasks)
7. [Next Steps](#-next-steps)

## 🎯 Quick Setup (Recommended)

**Total Time: ~3 minutes**

### Step 1: Clone and Setup
```bash
git clone https://github.com/ArashiWander/Argus.git
cd Argus
./setup.sh
```

The setup wizard will:
- ✅ Check that you have Node.js 18+ installed
- ✅ Install all dependencies automatically
- ✅ Configure environment files with smart defaults
- ✅ Build the application
- ✅ Create helpful scripts for you
- ✅ Validate everything is working

### Step 2: Start the Platform
```bash
./start.sh
```

### Step 3: Open in Browser
Open http://localhost:3000 in your browser

### Step 4: Add Sample Data (Optional)
```bash
# In a new terminal
./demo.sh
```

**That's it! 🎉** You now have a fully functional monitoring platform running.

## 🎁 What You'll Get

After setup, you'll have:

### 🌐 Web Interface
- **Dashboard**: Real-time system overview at http://localhost:3000
- **Metrics**: View and analyze performance data
- **Logs**: Search and filter log entries  
- **Alerts**: Configure monitoring alerts
- **Analytics**: Advanced data insights

### 🛠️ API Endpoints
- **REST API**: http://localhost:3001/api/
- **Health Check**: http://localhost:3001/api/health
- **Metrics**: Submit and query performance data
- **Logs**: Store and search log entries

### 📝 Helpful Scripts
- `./start.sh` - Start the platform
- `./health-check.sh` - Verify everything is working
- `./demo.sh` - Add sample data for testing
- `./setup.sh` - Re-run setup if needed

## 🎬 First Steps After Setup

### 1. Verify Everything is Running
```bash
./health-check.sh
```

You should see:
```
🔍 Argus Platform Health Check

Backend Service: ✅ Running
Frontend Service: ✅ Running
```

### 2. Explore the Dashboard
1. Open http://localhost:3000
2. You'll see the main dashboard with:
   - System overview
   - Recent metrics
   - Log entries
   - Health status

### 3. Add Sample Data
```bash
./demo.sh
```

This adds:
- 50 realistic metrics (CPU, memory, network, etc.)
- 30 log entries with different levels
- Sample alerts and analytics data
- Security events

### 4. Explore the Data
- **Metrics Page**: See charts and graphs of system performance
- **Logs Page**: Search through log entries by level, service, or content
- **Analytics**: View trends and insights

## 🎨 Understanding the Interface

### Dashboard Overview
- **Health Status**: Overall system health indicator
- **Metrics Summary**: Key performance indicators  
- **Recent Logs**: Latest log entries across services
- **Service Status**: Status of monitored services

### Metrics Section
- **Time-series Charts**: Visual representation of metrics over time
- **Filtering**: Filter by service, metric name, or time range
- **Real-time Updates**: Live data as it comes in

### Logs Section  
- **Search**: Find logs by message content
- **Filtering**: Filter by log level (error, warn, info, debug)
- **Service Filter**: View logs from specific services
- **Time Range**: Specify time windows

## 📊 Adding Your Own Data

### Submit Metrics via API
```bash
curl -X POST http://localhost:3001/api/metrics \
  -H "Content-Type: application/json" \
  -d '{
    "name": "cpu.usage",
    "value": 75.5,
    "service": "my-app",
    "tags": {"host": "server-1", "region": "us-east-1"}
  }'
```

### Submit Logs via API
```bash
curl -X POST http://localhost:3001/api/logs \
  -H "Content-Type: application/json" \
  -d '{
    "level": "info",
    "message": "Application started successfully",
    "service": "my-app",
    "tags": {"version": "1.0.0"}
  }'
```

### Bulk Operations
```bash
# Submit multiple logs at once
curl -X POST http://localhost:3001/api/logs/bulk \
  -H "Content-Type: application/json" \
  -d '{
    "logs": [
      {"level": "info", "message": "Request started", "service": "api"},
      {"level": "info", "message": "Request completed", "service": "api"}
    ]
  }'
```

## 🔧 Common Tasks

### Check System Health
```bash
./health-check.sh
# or
curl http://localhost:3001/api/health
```

### View Recent Metrics
```bash
curl http://localhost:3001/api/metrics
```

### Search Logs
```bash
# Get error logs
curl "http://localhost:3001/api/logs?level=error"

# Search for specific content
curl "http://localhost:3001/api/logs?search=database"

# Filter by service
curl "http://localhost:3001/api/logs?service=api"
```

### Stop the Platform
```bash
# Press Ctrl+C in the terminal running ./start.sh
# or
pkill -f "npm.*start"
```

### Restart After Changes
```bash
# Stop the platform (Ctrl+C)
# Then restart
./start.sh
```

## 🚀 Next Steps

### For Developers
1. **Read the Development Guide**: `docs/DEVELOPMENT.md`
2. **Explore the Code**: Check out `backend/src/` and `frontend/src/`
3. **Run Tests**: `cd backend && npm test`, `cd frontend && npm test`
4. **API Documentation**: View `docs/api-documentation.yaml`

### For Production Use
1. **Setup External Databases**: Re-run `./setup.sh` and choose "Production Mode"
2. **Configure Security**: Update JWT secrets and enable HTTPS
3. **Scale with Docker**: Use `docker-compose.yml` for production deployment
4. **Enable All Protocols**: Configure gRPC, MQTT, and Kafka for your use case

### Advanced Features
1. **Multi-Protocol Support**: Enable gRPC, MQTT, or Kafka protocols
2. **Database Integration**: Connect to InfluxDB, Elasticsearch, PostgreSQL, Redis
3. **Alerting**: Set up custom alert rules and notifications
4. **Analytics**: Explore anomaly detection and predictive features

## 🆘 Need Help?

### Quick Diagnostics
1. Run `./health-check.sh` to check system status
2. Check if ports 3000 and 3001 are available
3. Verify Node.js version: `node --version` (should be 18+)

### Common Issues
- **Port conflicts**: Change ports in `backend/.env`
- **Permission errors**: Run `chmod +x *.sh` to fix script permissions
- **Dependency issues**: Re-run `./setup.sh` to reinstall dependencies

### Getting Support
1. **Documentation**: Check `README.md` and `docs/` folder
2. **Troubleshooting**: See the troubleshooting section in `README.md`
3. **Issues**: Create a GitHub issue with diagnostic output

---

**Happy monitoring! 🎉**

For more detailed information, check out:
- [README.md](README.md) - Complete project overview
- [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) - Development guide
- [docs/PROTOCOLS.md](docs/PROTOCOLS.md) - Protocol documentation