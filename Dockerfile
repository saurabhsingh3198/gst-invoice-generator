# ==========================================
# Multi-Stage Dockerfile: GST Invoice Studio
# Packages React 19 Frontend + Spring Boot 3 Java Backend
# Output: Self-contained single executable image on Port 8080
# ==========================================

# ----------------- Stage 1: Build React Frontend -----------------
FROM node:20-alpine AS frontend-builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# ----------------- Stage 2: Build Spring Boot JAR -----------------
FROM maven:3.9.6-eclipse-temurin-21 AS backend-builder
WORKDIR /app

# Optimize Maven memory for Render free tier (512MB container)
ENV MAVEN_OPTS="-Xmx384m -XX:MaxMetaspaceSize=128m"

# Copy backend source
COPY backend/pom.xml .
COPY backend/src ./src

# Inject built React assets into Spring Boot static resources
COPY --from=frontend-builder /app/dist ./src/main/resources/static

# Build production executable JAR (skipping test compilation & execution)
RUN mvn clean package -DskipTests -Dmaven.test.skip=true -B -e

# ----------------- Stage 3: Minimal Production Runtime -----------------
FROM eclipse-temurin:21-jre-jammy
WORKDIR /app

# Non-root user for security
RUN groupadd -r appgroup && useradd -r -g appgroup appuser
USER appuser

# Copy built JAR from stage 2
COPY --from=backend-builder /app/target/*.jar app.jar

# Environment defaults
ENV PORT=8080
ENV SPRING_PROFILES_ACTIVE=prod
EXPOSE 8080

# Healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:8080/api/v1/auth/health || exit 1

ENTRYPOINT ["java", "-XX:+UseContainerSupport", "-XX:MaxRAMPercentage=75.0", "-jar", "app.jar"]
