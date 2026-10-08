---
title: Table Tennis Stroke Classifier
shortName: tt-strokes
tagline: A fine-tuned video transformer that names the stroke in a clip, served as an API, with its limits written down.
role: "Final-year project: fine-tuned the model and built the API around it."
summary: My final-year project at FAST-NUCES. VideoMAE fine-tuned on a 50 GB table-tennis dataset to classify 20 strokes plus a no-stroke class, wrapped in a FastAPI service with a Hugging Face model, Docker and an ONNX export.
tier: flagship
order: 5
status: shipped
period: Final-year project, 2024
stack: [Python, PyTorch, VideoMAE, Hugging Face Transformers, FastAPI, ONNX Runtime, Docker]
repos:
  - name: table-tennis-stroke-api
    ref: 5c37bba22a0d7a1a37c4bdc1ced19e2b7ce70d10
    role: api
  - name: Table-Tennis-Stroke-Classification-using-Advanced-Transformer-Architecture
    ref: 17918dfdb97689af413034c12abf6a9dd9b46088
    role: training notebook
links:
  - label: Model on Hugging Face
    url: https://huggingface.co/Adilmp/table-tennis-videomae
headline:
  - value: "85.8%"
    label: validation accuracy, 21 classes
    note: 200 of 233 clips; 20 strokes plus a no-stroke class
    receipt: { repo: table-tennis-stroke-api, path: README.md, find: "**85.8%** (200 of 233 clips)" }
  - value: "50 GB"
    label: of video to learn from
    note: the MediaEval table-tennis dataset from the Université de Bordeaux
    receipt: { repo: table-tennis-stroke-api, path: README.md, find: "50 GB of video" }
  - value: "1 to 2 s"
    label: CPU inference per clip
    note: no GPU needed to try it
    receipt: { repo: table-tennis-stroke-api, path: README.md, find: "about 1–2 s per clip" }
  - value: "86M"
    label: parameters, ViT-Base for video
    note: VideoMAE, fine-tuned rather than trained from scratch
    receipt: { repo: table-tennis-stroke-api, path: README.md, find: "86M parameters" }
assertions:
  - claim: The model classifies 21 stroke classes from video
    actual: 85.8% validation accuracy (200 of 233 clips)
    status: pass
    headline: true
    short: 85.8% validation accuracy on 21 classes
    receipt: { repo: table-tennis-stroke-api, path: README.md, find: "**85.8%** (200 of 233 clips)" }
  - claim: 85.8% is an estimate from a held-out test set
    expected: an untouched test split
    actual: no; it is validation accuracy on the split used to keep the best checkpoint, and no separate test number is reported
    status: fail
    headline: true
    short: "85.8% from an untouched test set: no"
    note: Choosing the best checkpoint by validation accuracy makes that number optimistic. I report it as a validation number and nothing more.
    receipt: { repo: table-tennis-stroke-api, path: README.md, find: "keeping the best model by validation accuracy" }
  - claim: It beats the best earlier result on this dataset
    expected: a like-for-like comparison with 68.78% (HCMUS, MediaEval 2021)
    actual: 85.8% against 68.78%, but one is validation accuracy and the other a published result, so the gap is encouraging rather than proven
    status: inconclusive
    short: "beats the cited best, 68.78%: not like for like"
    receipt: { repo: table-tennis-stroke-api, path: README.md, find: ["68.78%", "HCMUS, MediaEval 2021"] }
  - claim: The API returns a prediction in a second or two on CPU
    actual: POST /predict returns the stroke, confidence, inference time and top 5, at about 1 to 2 s per clip
    status: pass
    receipt: { repo: table-tennis-stroke-api, path: README.md, find: ["about 1–2 s per clip", "| `/predict` | POST |"] }
  - claim: The model can run outside the PyTorch stack
    actual: an ONNX export script and an ONNX Runtime CPU script are in the repo
    status: pass
    receipt: { repo: table-tennis-stroke-api, path: README.md, find: ["- [x] ONNX export", "scripts/onnx_inference.py"] }
  - claim: Anyone can reproduce inference
    actual: the weights are on the Hugging Face Hub and download on first start, and there is a Dockerfile
    status: pass
    receipt: { repo: table-tennis-stroke-api, path: README.md, find: ["on the Hugging Face Hub for reproducible inference", "docker build -t tt-stroke-api ."] }
  - claim: The confidence score is calibrated
    actual: no; a wrong prediction can still come with a very high score
    status: fail
    short: "confidence score is calibrated: no"
    note: This is the problem the Jev audit and jevcal measure and fix. I have not applied jevcal to this model yet.
    receipt: { repo: table-tennis-stroke-api, path: README.md, find: "Confidence isn't calibrated" }
  - claim: Similar strokes are told apart
    actual: no; loops are sometimes confused with hits, and serve spin types with each other
    status: fail
    receipt: { repo: table-tennis-stroke-api, path: README.md, find: "loops are sometimes confused with hits" }
  - claim: It works from other camera angles
    actual: not measured; the training clips are player-centred videos from one facility
    status: inconclusive
    short: "other camera angles: not measured"
    receipt: { repo: table-tennis-stroke-api, path: README.md, find: "Camera angle sensitivity" }
  - claim: The API has automated tests
    actual: no; tests for the API are still on the roadmap
    status: fail
    receipt: { repo: table-tennis-stroke-api, path: README.md, find: "- [ ] Tests for the API" }
failures:
  - title: A confident wrong answer is still a confident answer
    found: The softmax score is not calibrated, so a wrong prediction can come back with a very high score and look exactly like a right one.
    fix: Not fixed here. It is documented as a limitation, and the Jev audit and jevcal are my follow-up work on measuring and correcting exactly this.
    outcome: open
    receipt: { repo: table-tennis-stroke-api, path: README.md, find: "Confidence isn't calibrated" }
  - title: Look-alike strokes blur together
    found: Loops are sometimes confused with hits, and serve spin types (sidespin, topspin and backspin) with each other.
    fix: Not fixed. Pose estimation with MediaPipe is on the roadmap.
    outcome: open
    receipt: { repo: table-tennis-stroke-api, path: README.md, find: "Pose estimation integration (MediaPipe)" }
  - title: The training data is one facility from one angle
    found: The clips are player-centred videos from a single sports facility, so the model may generalise poorly to overhead, broadcast or behind-the-player views.
    fix: Not measured and not fixed. I say so here instead of implying robustness.
    outcome: open
    receipt: { repo: table-tennis-stroke-api, path: README.md, find: "Camera angle sensitivity" }
  - title: The API shipped without tests
    found: The service works, but nothing in the repo asserts that it keeps working.
    fix: Tests for the API are the first open item on the roadmap.
    outcome: open
    receipt: { repo: table-tennis-stroke-api, path: README.md, find: "- [ ] Tests for the API" }
decisions:
  - title: Fine-tune a video model instead of training one
    why: VideoMAE is a Vision Transformer pre-trained by hiding most of each clip and reconstructing it, then fine-tuned here for stroke classification.
  - title: Report the number with its caveat
    why: The best checkpoint was kept by validation accuracy, so 85.8% is a validation figure and is labelled as one.
  - title: Keep the service small
    why: FastAPI exposes /predict and /health, and /health returns the model name and device (CPU or CUDA) so a deploy can be checked in one request.
  - title: Export to ONNX
    why: The model can run with ONNX Runtime on CPU, outside the PyTorch stack.
diagram:
  caption: A clip goes in and a labelled prediction comes out. The known limits, uncalibrated confidence and one camera angle, are listed in the assertions rather than hidden in the diagram.
  receipt: { repo: table-tennis-stroke-api, path: README.md, find: ["Video upload → FastAPI → VideoMAE", "21-class stroke classification"] }
  nodes:
    - { id: video, label: Video clip, sub: ".mp4, .avi or .mov", col: 0, row: 0, kind: input }
    - { id: api, label: FastAPI /predict, sub: "upload as a form field", col: 1, row: 0 }
    - { id: frames, label: Preprocess, sub: "16 frames, 224 by 224", col: 2, row: 0 }
    - { id: model, label: VideoMAE, sub: "ViT-Base, 86M parameters", col: 3, row: 0, kind: model }
    - { id: out, label: JSON response, sub: "stroke, confidence, top 5", col: 4, row: 0, kind: output }
    - { id: hub, label: Hugging Face Hub, sub: "weights, about 350 MB", col: 3, row: 1, kind: store }
    - { id: onnx, label: ONNX export, sub: "ONNX Runtime on CPU", col: 4, row: 1 }
  edges:
    - { from: video, to: api }
    - { from: api, to: frames }
    - { from: frames, to: model }
    - { from: model, to: out }
    - { from: hub, to: model, label: weights }
    - { from: model, to: onnx, label: export }
  traces:
    - id: predict
      label: One prediction
      kind: ok
      path: [video, api, frames, model, out]
      outcome: The response carries the stroke, a softmax confidence, the inference time and the top 5 classes, in about 1 to 2 seconds on a CPU.
charts:
  - type: bars
    title: Validation accuracy against the best earlier result cited
    takeaway: The model scores 17 points above the best earlier result in our report, but the two numbers are not like for like.
    caption: 85.8% is validation accuracy on the split used to pick the checkpoint. 68.78% is the best earlier result cited in the project report (HCMUS, MediaEval 2021).
    unit: "%"
    max: 100
    receipt: { repo: table-tennis-stroke-api, path: README.md, find: ["**85.8%** (200 of 233 clips)", "68.78% (HCMUS, MediaEval 2021)"] }
    bars:
      - { label: This model, value: 85.8, display: "85.8%", sub: "validation", tone: accent }
      - { label: Best earlier cited, value: 68.78, display: "68.78%", sub: "HCMUS, 2021", tone: muted }
  - type: stack
    title: The 233 validation clips
    takeaway: 200 of 233 are right. The usual confusions are loops against hits, and serve spin types against each other.
    caption: Only the total is reported, not a per-class confusion matrix.
    receipt: { repo: table-tennis-stroke-api, path: README.md, find: ["**85.8%** (200 of 233 clips)", "loops are sometimes confused with hits"] }
    rows:
      - label: Validation clips
        total: 233 clips
        segments:
          - { label: Correct, value: 200, tone: pass }
          - { label: Wrong, value: 33, tone: fail }
---

## The problem

Table tennis training is full of footage and short of labels. I wanted a model that names the stroke in a video clip, as a first step toward analysing a player's technique.

## What I built

My final-year project at FAST-NUCES. I fine-tuned VideoMAE, a Vision Transformer for video, on the MediaEval table-tennis dataset from the Université de Bordeaux: 50 GB of player-centred clips across 21 classes. Then I wrapped the model in a FastAPI service. Upload a clip and get back the stroke, a confidence score, the inference time and the top five classes. The weights are on the Hugging Face Hub, there is a Docker image, and an ONNX export runs on CPU.

## How I tested it

Validation accuracy on 233 clips: 85.8%, or 200 correct. I kept the best checkpoint by that score, so it is a validation number and not a separate test result, and the site says so wherever it appears.

## What I would do next

Add tests for the API, measure other camera angles, try pose estimation on the strokes the model confuses, and run jevcal on its confidence scores.
