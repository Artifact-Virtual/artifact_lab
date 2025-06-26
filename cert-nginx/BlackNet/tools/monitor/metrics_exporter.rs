// This file implements the metrics exporter for monitoring the system.

use std::time::Duration;
use prometheus::{Encoder, IntCounter, IntGauge, Opts, Registry, TextEncoder};
use tokio::time::interval;

pub struct MetricsExporter {
    registry: Registry,
    request_counter: IntCounter,
    response_gauge: IntGauge,
}

impl MetricsExporter {
    pub fn new() -> Self {
        let registry = Registry::new();
        
        let request_counter = IntCounter::with_opts(Opts::new("requests_total", "Total number of requests"))
            .expect("Failed to create request counter");
        let response_gauge = IntGauge::with_opts(Opts::new("responses_in_progress", "Number of responses in progress"))
            .expect("Failed to create response gauge");

        registry.register(Box::new(request_counter.clone())).unwrap();
        registry.register(Box::new(response_gauge.clone())).unwrap();

        MetricsExporter {
            registry,
            request_counter,
            response_gauge,
        }
    }

    pub fn increment_request(&self) {
        self.request_counter.inc();
    }

    pub fn set_response_count(&self, count: i64) {
        self.response_gauge.set(count);
    }

    pub async fn start_exporting(&self) {
        let mut interval = interval(Duration::from_secs(10));
        loop {
            interval.tick().await;
            self.export_metrics().await;
        }
    }

    async fn export_metrics(&self) {
        let encoder = TextEncoder::new();
        let metric_families = self.registry.gather();
        let mut buffer = Vec::new();
        encoder.encode(&metric_families, &mut buffer).unwrap();
        let metrics = String::from_utf8(buffer).unwrap();
        println!("{}", metrics); // Replace with actual export logic (e.g., HTTP endpoint)
    }
}