import { forwardRef } from 'react';
import type { InvoiceData } from '../types/invoice';
import { formatIndianCurrency, numberToIndianWords, taxNumberToIndianWords } from '../utils/numberToWords';
import { getEffectiveTaxSummary, getTaxTotals, isInterStateTax } from '../utils/taxCalculation';
import { UpiQrCode } from './UpiQrCode';

interface InvoicePreviewProps {
  data: InvoiceData;
}

export const InvoicePreview = forwardRef<HTMLDivElement, InvoicePreviewProps>(
  ({ data }, ref) => {
    // Calculate total amount & optional Round Off
    const rawTotal = data.items.reduce(
      (sum, item) => sum + (Number(item.amount) || 0),
      0
    );
    const isRoundOffEnabled = data.enableRoundOff !== false;
    const roundedTotal = isRoundOffEnabled ? Math.round(rawTotal) : rawTotal;
    const roundOffDiff = isRoundOffEnabled ? Math.round((roundedTotal - rawTotal) * 100) / 100 : 0;
    const totalAmount = roundedTotal;

    // Sum Alt Quantities
    const totalAltQtyNumber = data.items.reduce((sum, item) => {
      const match = (item.altQuantity || '').match(/([0-9.,]+)/);
      if (match) {
        const val = parseFloat(match[1].replace(/,/g, ''));
        return sum + (isNaN(val) ? 0 : val);
      }
      return sum;
    }, 0);

    const altUnit =
      data.items.find((i) => i.altQuantity)?.altQuantity?.replace(/[0-9.,\s]/g, '') || 'KG';
    const totalAltQtyStr =
      totalAltQtyNumber > 0
        ? `${totalAltQtyNumber.toLocaleString('en-IN', {
            minimumFractionDigits: 3,
            maximumFractionDigits: 3,
          })} ${altUnit}`
        : '';

    // Calculate total primary quantity (e.g. PC items)
    const pcItems = data.items.filter((i) => (i.unit || '').toUpperCase() === 'PC');
    const totalPcQty = pcItems.reduce((sum, i) => sum + (Number(i.quantity) || 0), 0);
    const nonPcItems = data.items.filter((i) => (i.unit || '').toUpperCase() !== 'PC');
    const totalQuantityStr =
      totalPcQty > 0
        ? `${totalPcQty} PC`
        : nonPcItems.length > 0
        ? `${nonPcItems.reduce((s, i) => s + (Number(i.quantity) || 0), 0)} ${nonPcItems[0]?.unit || ''}`
        : '';

    // Amount in words
    const amountInWords = data.customAmountInWords?.trim()
      ? data.customAmountInWords
      : numberToIndianWords(totalAmount);

    // Tax breakdown calculation
    const taxRows = getEffectiveTaxSummary(data);
    const taxTotals = getTaxTotals(taxRows);
    const isInterState = isInterStateTax(data);

    // Tax amount in words
    const taxAmountInWords = data.customTaxAmountInWords?.trim()
      ? data.customTaxAmountInWords
      : taxNumberToIndianWords(taxTotals.totalTaxAmount);

    const signatoryCompany = data.signatoryCompany?.trim() || data.seller.name;

    // Calculate dynamic filler height so table seamlessly fills A4 page height
    // Each item is approx 30px
    const itemCount = data.items.length;
    const hasBankDetails = data.bankDetails?.showBankDetails !== false;
    const bankDetailsHeightAdjustment = hasBankDetails ? 45 : 0;
    const taxHeightAdjustment = data.showTaxSummary ? (50 + Math.min(taxRows.length, 4) * 16) : 0;
    const fillerHeight = Math.max(10, 240 - itemCount * 28 - taxHeightAdjustment - bankDetailsHeightAdjustment);

    return (
      <div className="invoice-print-wrapper flex flex-col items-center w-full">
        <div
          ref={ref}
          id="invoice-document"
          className="invoice-a4-page bg-white text-black box-border shadow-xl"
          style={{
            width: '210mm',
            minHeight: '297mm',
            padding: '10mm 12mm 8mm 12mm',
            boxSizing: 'border-box',
            fontFamily: 'Arial, Helvetica, sans-serif',
            fontSize: '10px',
            lineHeight: 1.3,
            color: '#000000',
            backgroundColor: '#ffffff',
          }}
        >
          {/* 1. Header Title: Tax Invoice centered above box, matching Sales_74 exactly */}
          <div
            style={{
              textAlign: 'center',
              fontWeight: 'bold',
              fontSize: '13px',
              lineHeight: '16px',
              paddingTop: '2px',
              paddingBottom: '6px',
              color: '#000000',
              width: '100%',
            }}
          >
            {data.title || 'Tax Invoice'}
          </div>

          {/* Main Outer Box Border - 1px exact black border matching Sales_74 */}
          <div
            style={{
              border: '1px solid #000000',
              boxSizing: 'border-box',
              width: '100%',
              backgroundColor: '#ffffff',
            }}
          >

            {/* 2. Top Info Section (Left: Company/Consignee/Buyer, Right: Dispatch Grid) */}
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                tableLayout: 'fixed',
              }}
            >
              <tbody>
                <tr>
                  {/* Left Column: 55% width */}
                  <td
                    style={{
                      width: '55%',
                      borderRight: '1px solid #000000',
                      verticalAlign: 'top',
                      padding: 0,
                    }}
                  >
                    {/* Seller Details */}
                    <div
                      style={{
                        padding: '4px 6px',
                        borderBottom: '1px solid #000000',
                        minHeight: '92px',
                        boxSizing: 'border-box',
                      }}
                    >
                      <div
                        style={{
                          fontWeight: 'bold',
                          fontSize: '11.5px',
                          textTransform: 'uppercase',
                        }}
                      >
                        {data.seller.name}
                      </div>
                      {data.seller.addressLine1 && (
                        <div style={{ fontSize: '9.5px', textTransform: 'uppercase' }}>
                          {data.seller.addressLine1}
                        </div>
                      )}
                      {data.seller.addressLine2 && (
                        <div style={{ fontSize: '9.5px', textTransform: 'uppercase' }}>
                          {data.seller.addressLine2}
                        </div>
                      )}
                      <div style={{ fontSize: '9.5px', marginTop: '1px' }}>
                        <span>GSTIN/UIN: </span>
                        <span style={{ fontWeight: 'bold' }}>{data.seller.gstin}</span>
                      </div>
                      <div style={{ fontSize: '9.5px' }}>
                        <span>State Name : </span>
                        <span>{data.seller.stateName}</span>
                        <span>, Code : </span>
                        <span>{data.seller.stateCode}</span>
                      </div>
                      {data.seller.email && (
                        <div style={{ fontSize: '9.5px' }}>
                          <span>E-Mail : </span>
                          <span>{data.seller.email}</span>
                        </div>
                      )}
                    </div>

                    {/* Consignee (Ship to) */}
                    <div
                      style={{
                        padding: '4px 6px',
                        borderBottom: '1px solid #000000',
                        minHeight: '74px',
                        boxSizing: 'border-box',
                      }}
                    >
                      <div style={{ fontSize: '9px', color: '#222222' }}>
                        Consignee (Ship to)
                      </div>
                      <div
                        style={{
                          fontWeight: 'bold',
                          fontSize: '11px',
                          textTransform: 'uppercase',
                          marginTop: '1px',
                        }}
                      >
                        {data.consignee.name}
                      </div>
                      <div
                        style={{
                          fontSize: '9.5px',
                          textTransform: 'uppercase',
                          whiteSpace: 'pre-line',
                        }}
                      >
                        {data.consignee.address}
                      </div>
                      <div style={{ fontSize: '9.5px', marginTop: '4px' }}>
                        <span>State Name &nbsp;&nbsp;: </span>
                        <span>{data.consignee.stateName}</span>
                        <span>, Code : </span>
                        <span>{data.consignee.stateCode}</span>
                      </div>
                    </div>

                    {/* Buyer (Bill to) */}
                    <div
                      style={{
                        padding: '4px 6px',
                        minHeight: '74px',
                        boxSizing: 'border-box',
                      }}
                    >
                      <div style={{ fontSize: '9px', color: '#222222' }}>
                        Buyer (Bill to)
                      </div>
                      <div
                        style={{
                          fontWeight: 'bold',
                          fontSize: '11px',
                          textTransform: 'uppercase',
                          marginTop: '1px',
                        }}
                      >
                        {data.buyer.name}
                      </div>
                      <div
                        style={{
                          fontSize: '9.5px',
                          textTransform: 'uppercase',
                          whiteSpace: 'pre-line',
                        }}
                      >
                        {data.buyer.address}
                      </div>
                      <div style={{ fontSize: '9.5px', marginTop: '4px' }}>
                        <span>State Name &nbsp;&nbsp;: </span>
                        <span>{data.buyer.stateName}</span>
                        <span>, Code : </span>
                        <span>{data.buyer.stateCode}</span>
                      </div>
                    </div>
                  </td>

                  {/* Right Column: 45% width dispatch details table */}
                  <td
                    style={{
                      width: '45%',
                      verticalAlign: 'top',
                      padding: 0,
                    }}
                  >
                    <table
                      style={{
                        width: '100%',
                        borderCollapse: 'collapse',
                        tableLayout: 'fixed',
                        fontSize: '9.5px',
                      }}
                    >
                      <tbody>
                        {/* Row 1: Invoice No & Dated */}
                        <tr style={{ borderBottom: '1px solid #000000', height: '34px' }}>
                          <td
                            style={{
                              width: '50%',
                              borderRight: '1px solid #000000',
                              padding: '2px 4px',
                              verticalAlign: 'top',
                            }}
                          >
                            <div style={{ fontSize: '8.5px', color: '#222222' }}>
                              Invoice No.
                            </div>
                            <div style={{ fontWeight: 'bold', fontSize: '10.5px' }}>
                              {data.dispatch.invoiceNo || '\u00A0'}
                            </div>
                          </td>
                          <td
                            style={{
                              width: '50%',
                              padding: '2px 4px',
                              verticalAlign: 'top',
                            }}
                          >
                            <div style={{ fontSize: '8.5px', color: '#222222' }}>Dated</div>
                            <div style={{ fontWeight: 'bold', fontSize: '10.5px' }}>
                              {data.dispatch.invoiceDate || '\u00A0'}
                            </div>
                          </td>
                        </tr>

                        {/* Row 2: Delivery Note & Mode/Terms of Payment */}
                        <tr style={{ borderBottom: '1px solid #000000', height: '28px' }}>
                          <td
                            style={{
                              borderRight: '1px solid #000000',
                              padding: '2px 4px',
                              verticalAlign: 'top',
                            }}
                          >
                            <div style={{ fontSize: '8.5px', color: '#222222' }}>
                              Delivery Note
                            </div>
                            <div>{data.dispatch.deliveryNote || '\u00A0'}</div>
                          </td>
                          <td style={{ padding: '2px 4px', verticalAlign: 'top' }}>
                            <div style={{ fontSize: '8.5px', color: '#222222' }}>
                              Mode/Terms of Payment
                            </div>
                            <div>{data.dispatch.modeTermsOfPayment || '\u00A0'}</div>
                          </td>
                        </tr>

                        {/* Row 3: Reference No. & Date. & Other References */}
                        <tr style={{ borderBottom: '1px solid #000000', height: '28px' }}>
                          <td
                            style={{
                              borderRight: '1px solid #000000',
                              padding: '2px 4px',
                              verticalAlign: 'top',
                            }}
                          >
                            <div style={{ fontSize: '8.5px', color: '#222222' }}>
                              Reference No. & Date.
                            </div>
                            <div>{data.dispatch.referenceNoAndDate || '\u00A0'}</div>
                          </td>
                          <td style={{ padding: '2px 4px', verticalAlign: 'top' }}>
                            <div style={{ fontSize: '8.5px', color: '#222222' }}>
                              Other References
                            </div>
                            <div>{data.dispatch.otherReferences || '\u00A0'}</div>
                          </td>
                        </tr>

                        {/* Row 4: Buyer's Order No. & Dated */}
                        <tr style={{ borderBottom: '1px solid #000000', height: '28px' }}>
                          <td
                            style={{
                              borderRight: '1px solid #000000',
                              padding: '2px 4px',
                              verticalAlign: 'top',
                            }}
                          >
                            <div style={{ fontSize: '8.5px', color: '#222222' }}>
                              Buyer’s Order No.
                            </div>
                            <div>{data.dispatch.buyersOrderNo || '\u00A0'}</div>
                          </td>
                          <td style={{ padding: '2px 4px', verticalAlign: 'top' }}>
                            <div style={{ fontSize: '8.5px', color: '#222222' }}>Dated</div>
                            <div>{data.dispatch.orderDate || '\u00A0'}</div>
                          </td>
                        </tr>

                        {/* Row 5: Dispatch Doc No. & Delivery Note Date */}
                        <tr style={{ borderBottom: '1px solid #000000', height: '30px' }}>
                          <td
                            style={{
                              borderRight: '1px solid #000000',
                              padding: '2px 4px 2px 4px',
                              verticalAlign: 'top',
                            }}
                          >
                            <div style={{ fontSize: '8px', color: '#222222', lineHeight: 1.1, marginBottom: '2px' }}>
                              Dispatch Doc No.
                            </div>
                            <div style={{ fontWeight: 'bold', fontSize: '9.5px', lineHeight: 1.15 }}>
                              {data.dispatch.dispatchDocNo || '\u00A0'}
                            </div>
                          </td>
                          <td style={{ padding: '2px 4px 2px 4px', verticalAlign: 'top' }}>
                            <div style={{ fontSize: '8px', color: '#222222', lineHeight: 1.1, marginBottom: '2px' }}>
                              Delivery Note Date
                            </div>
                            <div style={{ fontSize: '9.5px', lineHeight: 1.15 }}>{data.dispatch.deliveryNoteDate || '\u00A0'}</div>
                          </td>
                        </tr>

                        {/* Row 6: Dispatched through & Destination */}
                        <tr style={{ borderBottom: '1px solid #000000', height: '36px' }}>
                          <td
                            style={{
                              borderRight: '1px solid #000000',
                              padding: '2px 4px 4px 4px',
                              verticalAlign: 'top',
                            }}
                          >
                            <div style={{ fontSize: '8px', color: '#222222', lineHeight: 1.1, marginBottom: '3px' }}>
                              Dispatched through
                            </div>
                            <div style={{ fontWeight: 'bold', textTransform: 'uppercase', fontSize: '9.5px', lineHeight: 1.15 }}>
                              {data.dispatch.dispatchedThrough || '\u00A0'}
                            </div>
                          </td>
                          <td style={{ padding: '2px 4px 4px 4px', verticalAlign: 'top' }}>
                            <div style={{ fontSize: '8px', color: '#222222', lineHeight: 1.1, marginBottom: '3px' }}>
                              Destination
                            </div>
                            <div style={{ fontWeight: 'bold', fontSize: '9.5px', lineHeight: 1.15 }}>
                              {data.dispatch.destination || '\u00A0'}
                            </div>
                          </td>
                        </tr>

                        {/* Row 7: Terms of Delivery (spans across both columns) */}
                        <tr style={{ height: '56px' }}>
                          <td
                            colSpan={2}
                            style={{
                              padding: '2px 4px',
                              verticalAlign: 'top',
                            }}
                          >
                            <div style={{ fontSize: '8px', color: '#222222', lineHeight: 1.1, marginBottom: '2px' }}>
                              Terms of Delivery
                            </div>
                            <div style={{ whiteSpace: 'pre-line', fontSize: '9px', lineHeight: 1.25 }}>
                              {data.dispatch.termsOfDelivery || '\u00A0'}
                            </div>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </td>
                </tr>
              </tbody>
            </table>

            {/* 3. Items Table */}
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                tableLayout: 'fixed',
                borderTop: '1px solid #000000',
                fontSize: '9.5px',
              }}
            >
              <thead>
                <tr
                  style={{
                    borderBottom: '1px solid #000000',
                    fontSize: '8.5px',
                    height: '32px',
                  }}
                >
                  <th
                    style={{
                      width: '3.8%',
                      borderRight: '1px solid #000000',
                      fontWeight: 'normal',
                      textAlign: 'center',
                      verticalAlign: 'middle',
                      padding: '2px 1px',
                      fontSize: '8px',
                      lineHeight: 1.15,
                    }}
                  >
                    Sl<br />No.
                  </th>
                  <th
                    style={{
                      width: '28%',
                      borderRight: '1px solid #000000',
                      fontWeight: 'normal',
                      textAlign: 'center',
                      verticalAlign: 'middle',
                      padding: '2px 4px',
                      fontSize: '8.5px',
                      lineHeight: 1.2,
                    }}
                  >
                    Description of Goods
                  </th>
                  <th
                    style={{
                      width: '8.5%',
                      borderRight: '1px solid #000000',
                      fontWeight: 'normal',
                      textAlign: 'center',
                      verticalAlign: 'middle',
                      padding: '2px 1px',
                      fontSize: '8.5px',
                    }}
                  >
                    HSN/SAC
                  </th>
                  <th
                    style={{
                      width: '11.5%',
                      borderRight: '1px solid #000000',
                      fontWeight: 'normal',
                      textAlign: 'center',
                      verticalAlign: 'middle',
                      padding: '2px 2px',
                      fontSize: '8.5px',
                    }}
                  >
                    Alt. Quantity
                  </th>
                  <th
                    style={{
                      width: '9%',
                      borderRight: '1px solid #000000',
                      fontWeight: 'normal',
                      textAlign: 'center',
                      verticalAlign: 'middle',
                      padding: '2px 2px',
                      fontSize: '8.5px',
                    }}
                  >
                    Quantity
                  </th>
                  <th
                    style={{
                      width: '10%',
                      borderRight: '1px solid #000000',
                      fontWeight: 'normal',
                      textAlign: 'center',
                      verticalAlign: 'middle',
                      padding: '2px 1px',
                      fontSize: '8.5px',
                      lineHeight: 1.15,
                    }}
                  >
                    Rate<br />
                    <span style={{ fontSize: '7.5px', display: 'block', marginTop: '1px' }}>
                      (Incl. of Tax)
                    </span>
                  </th>
                  <th
                    style={{
                      width: '8.5%',
                      borderRight: '1px solid #000000',
                      fontWeight: 'normal',
                      textAlign: 'center',
                      verticalAlign: 'middle',
                      padding: '2px 2px',
                      fontSize: '8.5px',
                    }}
                  >
                    Rate
                  </th>
                  <th
                    style={{
                      width: '4%',
                      borderRight: '1px solid #000000',
                      fontWeight: 'normal',
                      textAlign: 'center',
                      verticalAlign: 'middle',
                      padding: '2px 1px',
                      fontSize: '8.5px',
                    }}
                  >
                    per
                  </th>
                  <th
                    style={{
                      width: '5.2%',
                      borderRight: '1px solid #000000',
                      fontWeight: 'normal',
                      textAlign: 'center',
                      verticalAlign: 'middle',
                      padding: '2px 1px',
                      fontSize: '8px',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    Disc. %
                  </th>
                  <th
                    style={{
                      width: '11.5%',
                      fontWeight: 'normal',
                      textAlign: 'center',
                      verticalAlign: 'middle',
                      padding: '2px 4px',
                      fontSize: '8.5px',
                    }}
                  >
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((item, index) => (
                  <tr key={item.id || index} style={{ verticalAlign: 'top' }}>
                    {/* Sl No */}
                    <td
                      style={{
                        borderRight: '1px solid #000000',
                        textAlign: 'center',
                        fontWeight: 'bold',
                        padding: '2px 1px',
                      }}
                    >
                      {item.slNo || index + 1}
                    </td>

                    {/* Description */}
                    <td
                      style={{
                        borderRight: '1px solid #000000',
                        textAlign: 'left',
                        fontWeight: 'bold',
                        textTransform: 'uppercase',
                        whiteSpace: 'pre-line',
                        lineHeight: 1.25,
                        padding: '2px 4px',
                      }}
                    >
                      {item.description}
                    </td>

                    {/* HSN/SAC */}
                    <td
                      style={{
                        borderRight: '1px solid #000000',
                        textAlign: 'center',
                        padding: '2px 1px',
                      }}
                    >
                      {item.hsnSac}
                    </td>

                    {/* Alt. Quantity */}
                    <td
                      style={{
                        borderRight: '1px solid #000000',
                        textAlign: 'right',
                        fontWeight: 'bold',
                        whiteSpace: 'nowrap',
                        padding: '2px 4px',
                      }}
                    >
                      {item.altQuantity}
                    </td>

                    {/* Quantity */}
                    <td
                      style={{
                        borderRight: '1px solid #000000',
                        textAlign: 'right',
                        fontWeight: 'bold',
                        whiteSpace: 'nowrap',
                        padding: '2px 4px',
                      }}
                    >
                      {item.quantity ? `${item.quantity} ${item.unit || ''}` : ''}
                    </td>

                    {/* Rate (Incl. of Tax) */}
                    <td
                      style={{
                        borderRight: '1px solid #000000',
                        textAlign: 'right',
                        whiteSpace: 'nowrap',
                        padding: '2px 4px',
                      }}
                    >
                      {item.rateInclTax !== undefined && item.rateInclTax !== ''
                        ? typeof item.rateInclTax === 'number'
                          ? formatIndianCurrency(item.rateInclTax)
                          : item.rateInclTax
                        : ''}
                    </td>

                    {/* Rate */}
                    <td
                      style={{
                        borderRight: '1px solid #000000',
                        textAlign: 'right',
                        whiteSpace: 'nowrap',
                        padding: '2px 4px',
                      }}
                    >
                      {item.rate ? formatIndianCurrency(Number(item.rate)) : ''}
                    </td>

                    {/* per */}
                    <td
                      style={{
                        borderRight: '1px solid #000000',
                        textAlign: 'center',
                        padding: '2px 1px',
                      }}
                    >
                      {item.per || item.unit}
                    </td>

                    {/* Disc. % */}
                    <td
                      style={{
                        borderRight: '1px solid #000000',
                        textAlign: 'right',
                        padding: '2px 2px',
                      }}
                    >
                      {item.discountPercent ? `${item.discountPercent}%` : ''}
                    </td>

                    {/* Amount */}
                    <td
                      style={{
                        textAlign: 'right',
                        fontWeight: 'bold',
                        whiteSpace: 'nowrap',
                        padding: '2px 4px',
                      }}
                    >
                      {item.amount ? formatIndianCurrency(Number(item.amount)) : ''}
                    </td>
                  </tr>
                ))}

                {/* Empty Filler Row ensuring continuous vertical lines stretch down to total */}
                <tr style={{ height: `${fillerHeight}px` }}>
                  <td style={{ borderRight: '1px solid #000000' }}></td>
                  <td style={{ borderRight: '1px solid #000000' }}></td>
                  <td style={{ borderRight: '1px solid #000000' }}></td>
                  <td style={{ borderRight: '1px solid #000000' }}></td>
                  <td style={{ borderRight: '1px solid #000000' }}></td>
                  <td style={{ borderRight: '1px solid #000000' }}></td>
                  <td style={{ borderRight: '1px solid #000000' }}></td>
                  <td style={{ borderRight: '1px solid #000000' }}></td>
                  <td style={{ borderRight: '1px solid #000000' }}></td>
                  <td></td>
                </tr>
              </tbody>

              {/* Total Row */}
              <tfoot>
                {isRoundOffEnabled && Math.abs(roundOffDiff) > 0.001 && (
                  <tr
                    style={{
                      borderTop: '1px solid #000000',
                      fontSize: '9px',
                      color: '#222222',
                      height: '18px',
                    }}
                  >
                    <td
                      colSpan={8}
                      style={{
                        borderRight: '1px solid #000000',
                        textAlign: 'right',
                        padding: '1px 6px',
                        fontStyle: 'italic',
                      }}
                    >
                      Round Off
                    </td>
                    <td
                      style={{
                        textAlign: 'right',
                        whiteSpace: 'nowrap',
                        padding: '1px 4px',
                        fontWeight: 'bold',
                      }}
                    >
                      {roundOffDiff > 0 ? `+${roundOffDiff.toFixed(2)}` : roundOffDiff.toFixed(2)}
                    </td>
                  </tr>
                )}
                <tr
                  style={{
                    borderTop: '1px solid #000000',
                    borderBottom: '1px solid #000000',
                    fontWeight: 'bold',
                    fontSize: '9.5px',
                    height: '24px',
                  }}
                >
                  <td
                    colSpan={3}
                    style={{
                      borderRight: '1px solid #000000',
                      textAlign: 'center',
                      padding: '2px 4px',
                    }}
                  >
                    Total
                  </td>
                  <td
                    style={{
                      borderRight: '1px solid #000000',
                      textAlign: 'right',
                      whiteSpace: 'nowrap',
                      padding: '2px 4px',
                    }}
                  >
                    {totalAltQtyStr}
                  </td>
                  <td
                    style={{
                      borderRight: '1px solid #000000',
                      textAlign: 'right',
                      whiteSpace: 'nowrap',
                      padding: '2px 4px',
                    }}
                  >
                    {totalQuantityStr}
                  </td>
                  <td style={{ borderRight: '1px solid #000000' }}></td>
                  <td style={{ borderRight: '1px solid #000000' }}></td>
                  <td style={{ borderRight: '1px solid #000000' }}></td>
                  <td style={{ borderRight: '1px solid #000000' }}></td>
                  <td
                    style={{
                      textAlign: 'right',
                      whiteSpace: 'nowrap',
                      padding: '2px 4px',
                      fontWeight: 'bold',
                    }}
                  >
                    ₹ {formatIndianCurrency(totalAmount)}
                  </td>
                </tr>
              </tfoot>
            </table>

            {/* 4. Amount Chargeable In Words & E. & O.E */}
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                borderBottom: '1px solid #000000',
                fontSize: '9.5px',
              }}
            >
              <tbody>
                <tr>
                  <td style={{ padding: '4px 6px 6px 6px', verticalAlign: 'top' }}>
                    <div style={{ fontSize: '8.5px', color: '#222222', lineHeight: '1.2' }}>
                      Amount Chargeable (in words)
                    </div>
                    <div
                      style={{
                        fontWeight: 'bold',
                        fontSize: '10px',
                        lineHeight: '1.3',
                        marginTop: '2px',
                      }}
                    >
                      {amountInWords}
                    </div>
                  </td>
                  <td
                    style={{
                      padding: '4px 6px 6px 6px',
                      textAlign: 'right',
                      verticalAlign: 'top',
                      fontStyle: 'italic',
                      fontWeight: 'normal',
                      fontSize: '9.5px',
                      width: '80px',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    E. & O.E
                  </td>
                </tr>
              </tbody>
            </table>

            {/* HSN/SAC Tax Summary Table & Tax in Words (Pixel-exact match to user screenshot) */}
            {data.showTaxSummary ? (
              <>
                <table
                  style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    fontSize: '8.5px',
                    tableLayout: 'fixed',
                  }}
                >
                  <thead>
                    {isInterState ? (
                      /* Inter-State Tax (IGST) Header */
                      <>
                        <tr style={{ height: '22px' }}>
                          <th
                            rowSpan={2}
                            style={{
                              width: '45%',
                              borderRight: '1px solid #000000',
                              borderBottom: '1px solid #000000',
                              padding: '4px 4px',
                              textAlign: 'center',
                              verticalAlign: 'middle',
                              fontWeight: 'normal',
                            }}
                          >
                            HSN/SAC
                          </th>
                          <th
                            rowSpan={2}
                            style={{
                              width: '17%',
                              borderRight: '1px solid #000000',
                              borderBottom: '1px solid #000000',
                              padding: '4px 4px',
                              textAlign: 'center',
                              verticalAlign: 'middle',
                              lineHeight: '1.25',
                              fontWeight: 'normal',
                            }}
                          >
                            Taxable<br />Value
                          </th>
                          <th
                            colSpan={2}
                            style={{
                              width: '23%',
                              borderRight: '1px solid #000000',
                              borderBottom: '1px solid #000000',
                              padding: '3px 4px',
                              textAlign: 'center',
                              verticalAlign: 'middle',
                              fontWeight: 'normal',
                            }}
                          >
                            Integrated Tax
                          </th>
                          <th
                            rowSpan={2}
                            style={{
                              width: '15%',
                              borderBottom: '1px solid #000000',
                              padding: '4px 4px',
                              textAlign: 'center',
                              verticalAlign: 'middle',
                              lineHeight: '1.25',
                              fontWeight: 'normal',
                            }}
                          >
                            Total<br />Tax Amount
                          </th>
                        </tr>
                        <tr style={{ height: '20px' }}>
                          <th
                            style={{
                              width: '8%',
                              borderRight: '1px solid #000000',
                              borderBottom: '1px solid #000000',
                              padding: '3px 2px',
                              textAlign: 'center',
                              verticalAlign: 'middle',
                              fontWeight: 'normal',
                            }}
                          >
                            Rate
                          </th>
                          <th
                            style={{
                              width: '15%',
                              borderRight: '1px solid #000000',
                              borderBottom: '1px solid #000000',
                              padding: '3px 3px',
                              textAlign: 'center',
                              verticalAlign: 'middle',
                              fontWeight: 'normal',
                            }}
                          >
                            Amount
                          </th>
                        </tr>
                      </>
                    ) : (
                      /* Intra-State Tax (CGST + SGST/UTGST) Header - Pixel-exact to user screenshot */
                      <>
                        <tr style={{ height: '22px' }}>
                          <th
                            rowSpan={2}
                            style={{
                              width: '40%',
                              borderRight: '1px solid #000000',
                              borderBottom: '1px solid #000000',
                              padding: '4px 4px',
                              textAlign: 'center',
                              verticalAlign: 'middle',
                              fontWeight: 'normal',
                            }}
                          >
                            HSN/SAC
                          </th>
                          <th
                            rowSpan={2}
                            style={{
                              width: '12%',
                              borderRight: '1px solid #000000',
                              borderBottom: '1px solid #000000',
                              padding: '4px 4px',
                              textAlign: 'center',
                              verticalAlign: 'middle',
                              lineHeight: '1.25',
                              fontWeight: 'normal',
                            }}
                          >
                            Taxable<br />Value
                          </th>
                          <th
                            colSpan={2}
                            style={{
                              width: '17%',
                              borderRight: '1px solid #000000',
                              borderBottom: '1px solid #000000',
                              padding: '3px 4px',
                              textAlign: 'center',
                              verticalAlign: 'middle',
                              fontWeight: 'normal',
                            }}
                          >
                            CGST
                          </th>
                          <th
                            colSpan={2}
                            style={{
                              width: '17%',
                              borderRight: '1px solid #000000',
                              borderBottom: '1px solid #000000',
                              padding: '3px 4px',
                              textAlign: 'center',
                              verticalAlign: 'middle',
                              fontWeight: 'normal',
                            }}
                          >
                            SGST/UTGST
                          </th>
                          <th
                            rowSpan={2}
                            style={{
                              width: '14%',
                              borderBottom: '1px solid #000000',
                              padding: '4px 4px',
                              textAlign: 'center',
                              verticalAlign: 'middle',
                              lineHeight: '1.25',
                              fontWeight: 'normal',
                            }}
                          >
                            Total<br />Tax Amount
                          </th>
                        </tr>
                        <tr style={{ height: '20px' }}>
                          <th
                            style={{
                              width: '5.5%',
                              borderRight: '1px solid #000000',
                              borderBottom: '1px solid #000000',
                              padding: '3px 2px',
                              textAlign: 'center',
                              verticalAlign: 'middle',
                              fontWeight: 'normal',
                            }}
                          >
                            Rate
                          </th>
                          <th
                            style={{
                              width: '11.5%',
                              borderRight: '1px solid #000000',
                              borderBottom: '1px solid #000000',
                              padding: '3px 3px',
                              textAlign: 'center',
                              verticalAlign: 'middle',
                              fontWeight: 'normal',
                            }}
                          >
                            Amount
                          </th>
                          <th
                            style={{
                              width: '5.5%',
                              borderRight: '1px solid #000000',
                              borderBottom: '1px solid #000000',
                              padding: '3px 2px',
                              textAlign: 'center',
                              verticalAlign: 'middle',
                              fontWeight: 'normal',
                            }}
                          >
                            Rate
                          </th>
                          <th
                            style={{
                              width: '11.5%',
                              borderRight: '1px solid #000000',
                              borderBottom: '1px solid #000000',
                              padding: '3px 3px',
                              textAlign: 'center',
                              verticalAlign: 'middle',
                              fontWeight: 'normal',
                            }}
                          >
                            Amount
                          </th>
                        </tr>
                      </>
                    )}
                  </thead>
                  <tbody>
                    {taxRows.map((row, idx) => (
                      <tr key={row.id || row.hsnSac || idx} style={{ height: '22px', fontSize: '9px' }}>
                        <td
                          style={{
                            borderRight: '1px solid #000000',
                            padding: '3px 6px',
                            textAlign: 'left',
                            verticalAlign: 'middle',
                            lineHeight: '1.2',
                          }}
                        >
                          {row.hsnSac}
                        </td>
                        <td
                          style={{
                            borderRight: '1px solid #000000',
                            padding: '3px 4px',
                            textAlign: 'right',
                            verticalAlign: 'middle',
                            whiteSpace: 'nowrap',
                            lineHeight: '1.2',
                          }}
                        >
                          {formatIndianCurrency(row.taxableValue)}
                        </td>
                        {isInterState ? (
                          <>
                            <td
                              style={{
                                borderRight: '1px solid #000000',
                                padding: '3px 2px',
                                textAlign: 'right',
                                verticalAlign: 'middle',
                                whiteSpace: 'nowrap',
                                lineHeight: '1.2',
                              }}
                            >
                              {row.igstRate || 0}%
                            </td>
                            <td
                              style={{
                                borderRight: '1px solid #000000',
                                padding: '3px 4px',
                                textAlign: 'right',
                                verticalAlign: 'middle',
                                whiteSpace: 'nowrap',
                                lineHeight: '1.2',
                              }}
                            >
                              {formatIndianCurrency(row.igstAmount || row.totalTaxAmount)}
                            </td>
                          </>
                        ) : (
                          <>
                            <td
                              style={{
                                borderRight: '1px solid #000000',
                                padding: '3px 2px',
                                textAlign: 'right',
                                verticalAlign: 'middle',
                                whiteSpace: 'nowrap',
                                lineHeight: '1.2',
                              }}
                            >
                              {row.cgstRate}%
                            </td>
                            <td
                              style={{
                                borderRight: '1px solid #000000',
                                padding: '3px 4px',
                                textAlign: 'right',
                                verticalAlign: 'middle',
                                whiteSpace: 'nowrap',
                                lineHeight: '1.2',
                              }}
                            >
                              {formatIndianCurrency(row.cgstAmount)}
                            </td>
                            <td
                              style={{
                                borderRight: '1px solid #000000',
                                padding: '3px 2px',
                                textAlign: 'right',
                                verticalAlign: 'middle',
                                whiteSpace: 'nowrap',
                                lineHeight: '1.2',
                              }}
                            >
                              {row.sgstRate}%
                            </td>
                            <td
                              style={{
                                borderRight: '1px solid #000000',
                                padding: '3px 4px',
                                textAlign: 'right',
                                verticalAlign: 'middle',
                                whiteSpace: 'nowrap',
                                lineHeight: '1.2',
                              }}
                            >
                              {formatIndianCurrency(row.sgstAmount)}
                            </td>
                          </>
                        )}
                        <td
                          style={{
                            padding: '3px 4px',
                            textAlign: 'right',
                            verticalAlign: 'middle',
                            whiteSpace: 'nowrap',
                            lineHeight: '1.2',
                          }}
                        >
                          {formatIndianCurrency(row.totalTaxAmount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>

                  {/* Total Row in tfoot with explicit 24px height, vertically centered */}
                  <tfoot>
                    <tr
                      style={{
                        height: '24px',
                        fontWeight: 'bold',
                        fontSize: '9px',
                      }}
                    >
                      <td
                        style={{
                          borderTop: '1px solid #000000',
                          borderBottom: '1px solid #000000',
                          borderRight: '1px solid #000000',
                          padding: '4px 6px',
                          textAlign: 'right',
                          verticalAlign: 'middle',
                          lineHeight: '1.2',
                        }}
                      >
                        Total
                      </td>
                      <td
                        style={{
                          borderTop: '1px solid #000000',
                          borderBottom: '1px solid #000000',
                          borderRight: '1px solid #000000',
                          padding: '4px 4px',
                          textAlign: 'right',
                          verticalAlign: 'middle',
                          whiteSpace: 'nowrap',
                          lineHeight: '1.2',
                        }}
                      >
                        {formatIndianCurrency(taxTotals.totalTaxableValue)}
                      </td>
                      {isInterState ? (
                        <>
                          <td
                            style={{
                              borderTop: '1px solid #000000',
                              borderBottom: '1px solid #000000',
                              borderRight: '1px solid #000000',
                              padding: '4px 2px',
                              verticalAlign: 'middle',
                            }}
                          ></td>
                          <td
                            style={{
                              borderTop: '1px solid #000000',
                              borderBottom: '1px solid #000000',
                              borderRight: '1px solid #000000',
                              padding: '4px 4px',
                              textAlign: 'right',
                              verticalAlign: 'middle',
                              whiteSpace: 'nowrap',
                              lineHeight: '1.2',
                            }}
                          >
                            {formatIndianCurrency(taxTotals.totalIgstAmount || taxTotals.totalTaxAmount)}
                          </td>
                        </>
                      ) : (
                        <>
                          <td
                            style={{
                              borderTop: '1px solid #000000',
                              borderBottom: '1px solid #000000',
                              borderRight: '1px solid #000000',
                              padding: '4px 2px',
                              verticalAlign: 'middle',
                            }}
                          ></td>
                          <td
                            style={{
                              borderTop: '1px solid #000000',
                              borderBottom: '1px solid #000000',
                              borderRight: '1px solid #000000',
                              padding: '4px 4px',
                              textAlign: 'right',
                              verticalAlign: 'middle',
                              whiteSpace: 'nowrap',
                              lineHeight: '1.2',
                            }}
                          >
                            {formatIndianCurrency(taxTotals.totalCgstAmount)}
                          </td>
                          <td
                            style={{
                              borderTop: '1px solid #000000',
                              borderBottom: '1px solid #000000',
                              borderRight: '1px solid #000000',
                              padding: '4px 2px',
                              verticalAlign: 'middle',
                            }}
                          ></td>
                          <td
                            style={{
                              borderTop: '1px solid #000000',
                              borderBottom: '1px solid #000000',
                              borderRight: '1px solid #000000',
                              padding: '4px 4px',
                              textAlign: 'right',
                              verticalAlign: 'middle',
                              whiteSpace: 'nowrap',
                              lineHeight: '1.2',
                            }}
                          >
                            {formatIndianCurrency(taxTotals.totalSgstAmount)}
                          </td>
                        </>
                      )}
                      <td
                        style={{
                          borderTop: '1px solid #000000',
                          borderBottom: '1px solid #000000',
                          padding: '4px 4px',
                          textAlign: 'right',
                          verticalAlign: 'middle',
                          whiteSpace: 'nowrap',
                          lineHeight: '1.2',
                        }}
                      >
                        {formatIndianCurrency(taxTotals.totalTaxAmount)}
                      </td>
                    </tr>
                  </tfoot>
                </table>

                {/* Tax Amount (in words) Row - Exactly matching screenshot */}
                <div
                  style={{
                    borderBottom: '1px solid #000000',
                    padding: '4px 6px 5px 6px',
                    fontSize: '9px',
                    lineHeight: '1.35',
                  }}
                >
                  <span style={{ fontWeight: 'normal' }}>Tax Amount (in words) : &nbsp;&nbsp;</span>
                  <span style={{ fontWeight: 'bold' }}>
                    {taxAmountInWords}
                  </span>
                </div>
              </>
            ) : (
              /* Blank spacing before Declaration if no tax summary */
              <div style={{ height: '75px', width: '100%', borderBottom: '1px solid #000000' }}></div>
            )}

            {/* 5. Bank Details, Declaration & Authorised Signatory */}
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '9px',
                tableLayout: 'fixed',
              }}
            >
              <tbody>
                <tr>
                  {/* Left Column: Bank Details & Declaration (~58%) */}
                  <td
                    style={{
                      width: '58%',
                      borderRight: '1px solid #000000',
                      padding: '4px 6px',
                      verticalAlign: 'top',
                    }}
                  >
                    {data.bankDetails?.showBankDetails !== false && (
                      <>
                        {/* 2-column robust table for Bank Details & QR Code (prevents flexbox height miscalculation) */}
                        <table
                          style={{
                            width: '100%',
                            borderCollapse: 'collapse',
                            tableLayout: 'fixed',
                            marginBottom: '4px',
                          }}
                        >
                          <tbody>
                            <tr>
                              {/* Bank details text */}
                              <td style={{ verticalAlign: 'top', padding: 0 }}>
                                <div
                                  style={{
                                    textDecoration: 'underline',
                                    fontWeight: 'bold',
                                    fontSize: '8.5px',
                                    marginBottom: '3px',
                                  }}
                                >
                                  Company&apos;s Bank Details
                                </div>
                                <div style={{ fontSize: '8.5px', lineHeight: '1.35' }}>
                                  <div>
                                    <span>Bank Name : </span>
                                    <span style={{ fontWeight: 'bold' }}>
                                      {data.bankDetails?.bankName || 'STATE BANK OF INDIA'}
                                    </span>
                                  </div>
                                  <div>
                                    <span>A/c No. : </span>
                                    <span style={{ fontWeight: 'bold' }}>
                                      {data.bankDetails?.accountNo || '381928371928'}
                                    </span>
                                  </div>
                                  <div>
                                    <span>Branch & IFS Code : </span>
                                    <span style={{ fontWeight: 'bold' }}>
                                      {data.bankDetails?.branchAndIfsc || 'NAUSAD GORAKHPUR & SBIN0001234'}
                                    </span>
                                  </div>
                                  {data.bankDetails?.upiId && (
                                    <div>
                                      <span>UPI ID (Pay) : </span>
                                      <span style={{ fontWeight: 'bold', color: '#1a56db' }}>
                                        {data.bankDetails.upiId}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </td>

                              {/* QR Code (if enabled) */}
                              {data.bankDetails?.showQrCode !== false && (
                                <td
                                  style={{
                                    width: '74px',
                                    verticalAlign: 'top',
                                    textAlign: 'center',
                                    padding: '0 0 4px 4px',
                                  }}
                                >
                                  <UpiQrCode
                                    upiId={data.bankDetails?.upiId || '8896925131@naviaxis'}
                                    payeeName={signatoryCompany}
                                    customQrUrl={data.bankDetails?.customQrUrl}
                                    size={56}
                                  />
                                </td>
                              )}
                            </tr>
                          </tbody>
                        </table>

                        {/* Dashed horizontal divider line matching screenshot */}
                        <div
                          style={{
                            borderTop: '1px dashed #666666',
                            margin: '4px 0 5px 0',
                            width: '100%',
                          }}
                        ></div>
                      </>
                    )}

                    {/* Declaration */}
                    <div
                      style={{
                        textDecoration: 'underline',
                        fontWeight: 'normal',
                        fontSize: '8.5px',
                        marginBottom: '2px',
                      }}
                    >
                      Declaration
                    </div>
                    <div style={{ fontSize: '8.5px', lineHeight: 1.25, color: '#111111' }}>
                      {data.declaration}
                    </div>
                  </td>

                  {/* Right Column: Signatory (~42%) */}
                  <td
                    style={{
                      width: '42%',
                      padding: '4px 6px',
                      verticalAlign: 'top',
                      textAlign: 'right',
                    }}
                  >
                    <div style={{ fontWeight: 'bold', fontSize: '9.5px' }}>
                      <span>for </span>
                      <span style={{ textTransform: 'uppercase' }}>{signatoryCompany}</span>
                    </div>

                    <div style={{ height: data.bankDetails?.showBankDetails !== false ? '64px' : '38px' }}></div>

                    <div style={{ fontSize: '9px', color: '#111111' }}>
                      Authorised Signatory
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* 6. Footer Note (Centered below outer border box) */}
          <div
            style={{
              textAlign: 'center',
              fontSize: '9px',
              paddingTop: '6px',
              color: '#111111',
              width: '100%',
            }}
          >
            This is a Computer Generated Invoice
          </div>
        </div>
      </div>
    );
  }
);

InvoicePreview.displayName = 'InvoicePreview';
