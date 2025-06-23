FROM rust:1.70 as builder

# Set the working directory
WORKDIR /usr/src/blacknet

# Copy the Cargo.toml and Cargo.lock files
COPY Cargo.toml Cargo.lock ./

# Create a new directory for the node
RUN mkdir -p node
WORKDIR /usr/src/blacknet/node

# Copy the node source code
COPY node/ .

# Build the node application
RUN cargo build --release

# Create a new stage for the final image
FROM debian:buster-slim

# Set the working directory
WORKDIR /usr/local/bin

# Copy the built binary from the builder stage
COPY --from=builder /usr/src/blacknet/target/release/relay /usr/local/bin/relay
COPY --from=builder /usr/src/blacknet/target/release/mix /usr/local/bin/mix
COPY --from=builder /usr/src/blacknet/target/release/exit /usr/local/bin/exit
COPY --from=builder /usr/src/blacknet/target/release/snapp_host /usr/local/bin/snapp_host

# Expose the necessary ports
EXPOSE 8080 8081 8082

# Command to run the node application
CMD ["relay"]