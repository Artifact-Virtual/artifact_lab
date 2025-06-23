FROM rust:1.67 as builder

# Set the working directory
WORKDIR /usr/src/blacknet/client

# Copy the Cargo.toml and Cargo.lock files
COPY client/Cargo.toml .
COPY client/Cargo.lock .

# Create a new directory for the source code
RUN mkdir src
# Create a dummy main.rs file to allow Cargo to build dependencies
RUN echo "fn main() { println!(\"dummy\"); }" > src/main.rs

# Build the dependencies
RUN cargo build --release
RUN rm src/main.rs

# Copy the actual source code
COPY client/src ./src

# Build the client application
RUN cargo build --release

# Create a new stage for the final image
FROM debian:buster-slim

# Set the working directory
WORKDIR /usr/local/bin

# Copy the built binary from the builder stage
COPY --from=builder /usr/src/blacknet/client/target/release/client .

# Set the entry point for the container
ENTRYPOINT ["./client"]