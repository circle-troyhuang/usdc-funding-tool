# Testnet USDC Funding Tool

Multi-chain testnet USDC funding tool using Circle's Smokebox (testnet) API. Supports ETH (Sepolia), SOL (Devnet), MATIC (Amoy), ARB (Sepolia), and AVAX (Fuji).

## Local Development

```bash
# Install dependencies
npm run install-all

# Copy environment file
cp .env.example .env

# Start dev server (Express on :4000, React on :3000 with proxy)
npm run dev
```

## Docker

```bash
# Build
docker build -t usdc-funding-tool .

# Run
docker run -p 4000:4000 \
  -e CIRCLE_API_URL=https://api-smokebox.circle.com/v1 \
  -e CIRCLE_WALLET_ID=1000659044 \
  usdc-funding-tool
```

Optionally set `CIRCLE_API_KEY` to use a server-side key (hides the key input in the UI).

## Deploy to AWS App Runner

### 1. Create ECR Repository

```bash
aws ecr create-repository \
  --repository-name usdc-funding-tool \
  --region us-east-1
```

### 2. Create IAM Role

Create an IAM role `AppRunnerECRAccessRole` with the `AWSAppRunnerServicePolicyForECRAccess` managed policy.

```bash
aws iam create-role \
  --role-name AppRunnerECRAccessRole \
  --assume-role-policy-document '{
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Principal": {"Service": "build.apprunner.amazonaws.com"},
      "Action": "sts:AssumeRole"
    }]
  }'

aws iam attach-role-policy \
  --role-name AppRunnerECRAccessRole \
  --policy-arn arn:aws:iam::aws:policy/service-role/AWSAppRunnerServicePolicyForECRAccess
```

### 3. Build & Push

```bash
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
REGION=us-east-1

aws ecr get-login-password --region $REGION | \
  docker login --username AWS --password-stdin $ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com

docker build -t usdc-funding-tool .
docker tag usdc-funding-tool:latest $ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/usdc-funding-tool:latest
docker push $ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/usdc-funding-tool:latest
```

### 4. Create App Runner Service

```bash
ROLE_ARN=$(aws iam get-role --role-name AppRunnerECRAccessRole --query 'Role.Arn' --output text)

aws apprunner create-service \
  --service-name usdc-funding-tool \
  --source-configuration "{
    \"AuthenticationConfiguration\": {\"AccessRoleArn\": \"$ROLE_ARN\"},
    \"AutoDeploymentsEnabled\": true,
    \"ImageRepository\": {
      \"ImageIdentifier\": \"$ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/usdc-funding-tool:latest\",
      \"ImageRepositoryType\": \"ECR\",
      \"ImageConfiguration\": {
        \"Port\": \"4000\",
        \"RuntimeEnvironmentVariables\": {
          \"CIRCLE_API_URL\": \"https://api-smokebox.circle.com/v1\",
          \"CIRCLE_WALLET_ID\": \"1000659044\"
        }
      }
    }
  }" \
  --instance-configuration '{
    "Cpu": "0.25 vCPU",
    "Memory": "0.5 GB"
  }' \
  --health-check-configuration '{
    "Protocol": "HTTP",
    "Path": "/api/health",
    "Interval": 10,
    "Timeout": 5,
    "HealthyThreshold": 1,
    "UnhealthyThreshold": 5
  }' \
  --region $REGION
```

The service URL will be available at `https://<service-id>.us-east-1.awsapprunner.com/`.

## Supported Chains

| Chain | Network | Explorer |
|-------|---------|----------|
| ETH | Sepolia | sepolia.etherscan.io |
| SOL | Devnet | explorer.solana.com |
| MATIC | Amoy | amoy.polygonscan.com |
| ARB | Sepolia | sepolia.arbiscan.io |
| AVAX | Fuji | testnet.snowtrace.io |
