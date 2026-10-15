// Indian Number System to Words Converter

const units = [
  '',
  'One',
  'Two',
  'Three',
  'Four',
  'Five',
  'Six',
  'Seven',
  'Eight',
  'Nine',
  'Ten',
  'Eleven',
  'Twelve',
  'Thirteen',
  'Fourteen',
  'Fifteen',
  'Sixteen',
  'Seventeen',
  'Eighteen',
  'Nineteen',
];

const tens = [
  '',
  '',
  'Twenty',
  'Thirty',
  'Forty',
  'Fifty',
  'Sixty',
  'Seventy',
  'Eighty',
  'Ninety',
];

function convertBelowThousand(n: number): string {
  let str = '';
  if (n >= 100) {
    str += units[Math.floor(n / 100)] + ' Hundred ';
    n %= 100;
  }
  if (n > 0) {
    if (n < 20) {
      str += units[n] + ' ';
    } else {
      str += tens[Math.floor(n / 10)];
      if (n % 10 > 0) {
        str += ' ' + units[n % 10];
      }
      str += ' ';
    }
  }
  return str.trim();
}

export function numberToIndianWords(amount: number): string {
  if (amount === 0) return 'INR Zero Only';

  const absAmount = Math.abs(amount);
  const rupees = Math.floor(absAmount);
  const paise = Math.round((absAmount - rupees) * 100);

  let remaining = rupees;
  let words = '';

  // Crores (10,000,000)
  const crores = Math.floor(remaining / 10000000);
  if (crores > 0) {
    words += convertBelowThousand(crores) + ' Crore ';
    remaining %= 10000000;
  }

  // Lakhs (100,000)
  const lakhs = Math.floor(remaining / 100000);
  if (lakhs > 0) {
    words += convertBelowThousand(lakhs) + ' Lakh ';
    remaining %= 100000;
  }

  // Thousands (1,000)
  const thousands = Math.floor(remaining / 1000);
  if (thousands > 0) {
    words += convertBelowThousand(thousands) + ' Thousand ';
    remaining %= 1000;
  }

  // Remaining (< 1,000)
  if (remaining > 0) {
    words += convertBelowThousand(remaining) + ' ';
  }

  words = words.trim();

  let result = 'INR ' + words;

  if (paise > 0) {
    result += ' and ' + convertBelowThousand(paise) + ' Paise';
  }

  result += ' Only';

  return result;
}

export function taxNumberToIndianWords(amount: number): string {
  if (!amount || isNaN(amount) || amount === 0) return 'INR Zero Only';

  const absAmount = Math.abs(amount);
  const rupees = Math.floor(absAmount);
  const paise = Math.round((absAmount - rupees) * 100);

  let remaining = rupees;
  let words = '';

  // Crores (10,000,000)
  const crores = Math.floor(remaining / 10000000);
  if (crores > 0) {
    words += convertBelowThousand(crores) + ' Crore ';
    remaining %= 10000000;
  }

  // Lakhs (100,000)
  const lakhs = Math.floor(remaining / 100000);
  if (lakhs > 0) {
    words += convertBelowThousand(lakhs) + ' Lakh ';
    remaining %= 100000;
  }

  // Thousands (1,000)
  const thousands = Math.floor(remaining / 1000);
  if (thousands > 0) {
    words += convertBelowThousand(thousands) + ' Thousand ';
    remaining %= 1000;
  }

  // Remaining (< 1,000)
  if (remaining > 0) {
    words += convertBelowThousand(remaining) + ' ';
  }

  words = words.trim();

  let result = 'INR ' + words;

  if (paise > 0) {
    result += ' and ' + convertBelowThousand(paise) + ' paise';
  }

  result += ' Only';

  return result;
}

export function formatIndianCurrency(num: number | undefined | null): string {
  if (num === undefined || num === null || isNaN(num)) return '0.00';
  return num.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
