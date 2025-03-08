use std::{
    env::args,
    fmt::Write as _,
    fs::read_to_string,
    num::{NonZeroU64, NonZeroUsize},
    ops::Range,
    process::exit,
    thread::available_parallelism,
};

use base64::{Engine as _, prelude::BASE64_STANDARD};
use rayon::ThreadPoolBuilder;
use sha2::{Digest, Sha256};

const TARGET: &str = "__TEMP__";

trait StringRot47Ext {
    fn rot47(&mut self);
}

impl StringRot47Ext for String {
    fn rot47(&mut self) {
        // SAFETY: We only operate on ASCII, so the existing capacity is sufficient.
        let bytes = unsafe { self.as_mut_vec() };
        for b in bytes.iter_mut() {
            if (b'!'..=b'~').contains(b) {
                *b = 33 + ((*b - 33 + 47) % 94);
            }
        }
    }
}

fn main() {
    let check_length: NonZeroU64 = args()
        .nth(1)
        .expect("Usage: program CHECK_LENGTH [START]")
        .parse()
        .expect("CHECK_LENGTH must be a number");

    let start: u64 = args()
        .nth(2)
        .and_then(|s| s.parse().ok())
        .unwrap_or_default();

    let payload = read_to_string("input.txt").expect("Failed to read input.txt");

    let worker_count = (available_parallelism().map(NonZeroUsize::get).unwrap() - 2).max(1);
    let iterations = start - (1 << (4 * check_length.get()));
    let iterations_per_worker = iterations / worker_count as u64;
    let remainder = iterations % worker_count as u64;

    let workers = ThreadPoolBuilder::new()
        .num_threads(worker_count)
        .build()
        .unwrap();

    let mut accumulator = start;
    for worker_ix in 0..worker_count {
        let workload = accumulator
            ..(accumulator
                + iterations_per_worker
                + if u64::try_from(worker_ix).unwrap() < remainder {
                    1
                } else {
                    0
                });
        accumulator = workload.end;

        workers.install(|| brute_force(&payload, workload, check_length));
    }
}

fn brute_force(payload: &str, workload: Range<u64>, check_length: NonZeroU64) {
    let check_length = usize::try_from(check_length.get()).unwrap();

    let mut number = String::with_capacity(check_length);
    let mut hasher = Sha256::new();

    for i in workload {
        write!(&mut number, "{i:0>check_length$x}").unwrap();
        number.rot47();
        let base64 = BASE64_STANDARD.encode(&number);
        let obfuscated = payload.replace(TARGET, &base64);
        hasher.update(&obfuscated[1..obfuscated.len() - 4]);
        let hash = format!("{:x}", hasher.finalize_reset());
        number.rot47();

        if hash.starts_with(&number) {
            println!("Match found: {}", BASE64_STANDARD.encode(&obfuscated));
            exit(0);
        }
        number.clear();
    }
}
