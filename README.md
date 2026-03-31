# GPA Calculator

A GPA planning tool built around the PolyU 4.3 grading scale.

It helps you:

- track courses by semester
- compare different major or study-plan options side by side
- estimate WES GPA for US graduate applications
- import transcript data from PDF files
- save and reload your planning data manually

Live site:
[https://4mthxmas20.github.io/gpa-calculator/](https://4mthxmas20.github.io/gpa-calculator/)

## Features

### 1. Course Editor

- Create multiple major options or study plans
- Add, rename, recolor, and delete plans
- Organize courses by semester
- Edit course name, credits, and grade manually
- See semester totals and cumulative GPA instantly

### 2. PolyU 4.3 GPA Summary

- Uses the PolyU 4.3 scale
- Calculates GPA from weighted grade points and credits
- Shows total credits and grade distribution
- Highlights A/B/C/D-F ranges visually

Supported grades:

`A+ A A- B+ B B- C+ C C- D+ D F`

### 3. Compare Major Options

- Compare multiple plans in one place
- Rank plans by PolyU GPA
- View total credits, number of courses, and semester counts
- Use side-by-side comparison to support major decisions

### 4. WES Conversion

- Converts PolyU grades to a WES-style 4.0 GPA
- Treats `A+` as `4.0`, matching the app's WES conversion logic
- Shows a simple admission outlook label such as `Strong Applicant` or `Competitive`
- Includes sample school-threshold comparisons for quick reference

### 5. PDF Transcript Import

- Import courses from text-based PDF transcripts
- Extracts course name, course code, credits, and grade
- Supports common PolyU transcript formatting
- Includes parsing fixes for special PDF glyphs that can affect grades like `A-` or `B+`
- Lets you review and edit imported rows before saving them into a semester

Notes:

- Works best with text-selectable PDFs
- Scanned image PDFs are not supported
- Mobile upload support is included, but browser behavior can still vary by device

### 6. Manual Save / Load

- The app starts fresh when opened
- Data is not stored automatically
- Export your plans as a JSON file
- Import a saved JSON file later to continue your work

## Screens

- `Course Editor`: build and edit semester-by-semester plans
- `Compare Majors`: compare different options
- `WES Conversion`: view WES GPA and admission-oriented summary

The layout is responsive and supports both desktop and mobile navigation.

## Tech Stack

- React
- Vite
- Tailwind CSS
- Zustand
- `pdfjs-dist`

## Project Structure

```text
.
├── README.md
├── package.json
└── react-app
    ├── package.json
    ├── src
    │   ├── components
    │   ├── store
    │   └── utils
    └── vite.config.js
```

## Local Development

From the repository root:

```bash
npm install --prefix react-app
npm run dev
```

Or inside `react-app`:

```bash
npm install
npm run dev
```

## Build

From the repository root:

```bash
npm run build
```

This runs the Vite production build in `react-app`.

## Deployment

The project is configured for GitHub Pages deployment with:

- Vite `base` set to `/gpa-calculator/`
- a GitHub Actions workflow in `.github/workflows/deploy.yml`

Pushes to `main` trigger a new Pages deployment.

## Use Case

This project is especially useful for students who:

- study under the PolyU 4.3 grading system
- want to compare different major paths
- need a quick WES-equivalent GPA estimate
- want to import transcript data instead of entering everything manually

## License

No license has been added yet.
