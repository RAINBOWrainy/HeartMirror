# HeartMirror Backend Dockerfile - Java Spring Boot
FROM eclipse-temurin:17-jre-alpine

WORKDIR /app

# Copy the JAR file
COPY backend-java/target/heartmirror-backend-1.0.0.jar app.jar

# Create data directory
RUN mkdir -p /app/data

# Expose port
EXPOSE 8080

# Set environment variables
ENV JAVA_OPTS="-Xmx512m -Xms256m"

# Start the application
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]