# GST Invoice Generator

A modern, responsive, client-side React + TypeScript application to generate, preview, customize, and export professional GST invoices and tax invoices with instant PDF generation and printing.

## Features

- **GST & Tax Compliance**: Support for CGST, SGST, IGST calculations, HSN/SAC codes, reverse charge, and tax summaries.
- **Dual View Modes**: Split editor/preview, full editor, and full preview modes.
- **Client-Side PDF Generation**: Direct high-resolution vector PDF export using `jspdf` and `html2canvas`.
- **Browser Native Print**: Pixel-perfect vector printing with custom CSS print stylesheets.
- **Indian Currency Formatting**: Built-in number-to-words currency conversion for Indian Rupees (INR).
- **Zero Backend Required**: Runs completely client-side in modern web browsers.

## Tech Stack

- **Framework**: [React 19](https://react.dev/) + [Vite](https://vite.dev/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **PDF Export**: [jsPDF](https://github.com/parallax/jsPDF) & [html2canvas](https://html2canvas.hertzen.com/)

## Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- npm or yarn

### Installation

```bash
npm install
```

### Development Server

```bash
npm run dev
```

### Production Build

```bash
npm run build
```

The output files will be built into the `dist/` directory.

### Preview Production Build

```bash
npm run preview
```

## Deployment & Updates

This project is deployed on **Vercel** with automatic continuous deployment connected to the `main` branch on GitHub.

To deploy updates, simply push to the `main` branch:

```bash
git add .
git commit -m "Your update description"
git push
```

Vercel will automatically build and publish the latest changes.
