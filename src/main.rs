use base64::Engine;
use base64::engine::general_purpose::STANDARD;
use sha2::{Digest, Sha256};

use std::sync::{Arc, atomic::{AtomicU64, Ordering}};
use std::fmt::Write;
use std::env;
use std::fs;

const BATCH_SIZE: u64 = 1_000_000;

fn rot47(s: &str) -> String {
    s.chars()
        .map(|c| {
            if ('!'..='~').contains(&c) {
                let new_c = 33 + ((c as u8 - 33 + 47) % 94);
                new_c as char
            } else {
                c
            }
        })
        .collect()
}

fn sha256(input: &str) -> String {
    let mut hasher = Sha256::new();
    hasher.update(input);
    format!("{:x}", hasher.finalize())
}

fn main() {
    let check_length: usize = env::args()
        .nth(1)
        .expect("Usage: program CHECK_LENGTH [START]")
        .parse()
        .expect("CHECK_LENGTH must be a number");
    
    let start = env::args().nth(2).and_then(|s| s.parse().ok()).unwrap_or(0);
    let payload = fs::read_to_string("input.txt").expect("Failed to read input.txt");
    
    let counter = Arc::new(AtomicU64::new(start));
    let num_workers = std::thread::available_parallelism()
        .map(|n| n.get())
        .unwrap() - 2;

    let mut handles = Vec::with_capacity(num_workers);
    for _ in 0..num_workers {
        let counter = Arc::clone(&counter);
        let payload = payload.clone();
        handles.push(std::thread::spawn(move || worker(counter, check_length, &payload)));
    }

    for handle in handles {
        handle.join().unwrap();
    }
}

fn worker(counter: Arc<AtomicU64>, check_length: usize, payload: &str) {
    let mut str_i = String::with_capacity(check_length);
    loop {
        let start = counter.fetch_add(BATCH_SIZE, Ordering::Relaxed);
        for i in start..start + BATCH_SIZE {
            str_i.clear();
            let _ = write!(&mut str_i, "{:0>width$x}", i, width = check_length);
            let rot47_str = rot47(&str_i);
            let base64_str = STANDARD.encode(&rot47_str);
            let obfuscated_payload = payload.replace("__TEMP__", &format!("{}", base64_str));
            // println!("{}", &obfuscated_payload[1..obfuscated_payload.len()-4]);
            let hash = sha256(&obfuscated_payload[1..obfuscated_payload.len() - 4]);

            if hash.starts_with(&str_i) {
                println!("Match found! Breaking loop...");
                println!("{}", STANDARD.encode(&obfuscated_payload));
                std::process::exit(0);
            }
        }
        println!("Worker checked up to: {}\tLast checked: {}", start + BATCH_SIZE, str_i);
    }
}