// This file implements the delay queue functionality for the mix node. 

use std::collections::VecDeque;
use std::time::{Duration, Instant};

pub struct DelayQueue {
    queue: VecDeque<(Instant, String)>,
    delay: Duration,
}

impl DelayQueue {
    pub fn new(delay: Duration) -> Self {
        DelayQueue {
            queue: VecDeque::new(),
            delay,
        }
    }

    pub fn push(&mut self, item: String) {
        let now = Instant::now();
        self.queue.push_back((now, item));
    }

    pub fn pop(&mut self) -> Option<String> {
        let now = Instant::now();
        while let Some(&(timestamp, ref item)) = self.queue.front() {
            if now.duration_since(timestamp) >= self.delay {
                self.queue.pop_front();
                return Some(item.clone());
            } else {
                break;
            }
        }
        None
    }

    pub fn is_empty(&self) -> bool {
        self.queue.is_empty()
    }
}