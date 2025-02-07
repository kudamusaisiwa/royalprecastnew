import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image, Font } from '@react-pdf/renderer';
import type { Order } from '../../types';

const LOGO_URL = "https://res.cloudinary.com/fresh-ideas/image/upload/v1731533951/o6no9tkm6wegl6mprrri.png";

// Register fonts if needed
Font.register({
  family: 'Helvetica',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/helveticaneue/v70/1Ptsg8zYS_SKggPNyC0IT0kLW-43aMEzIO6XUTLjad8.ttf' },
    { 
      src: 'https://fonts.gstatic.com/s/helveticaneue/v70/1Ptug8zYS_SKggPNyC0IT0kLW-43aMEzIO6XUTLjad8.ttf',
      fontWeight: 'bold'
    }
  ]
});

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 12,
    fontFamily: 'Helvetica'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30
  },
  leftColumn: {
    width: '60%'
  },
  rightColumn: {
    width: '35%'
  },
  logo: {
    width: 200,
    height: 80,
    objectFit: 'contain',
    marginBottom: 20
  },
  companyInfo: {
    marginBottom: 4,
    fontSize: 10,
    color: '#333333'
  },
  companyName: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'right'
  },
  orderInfoContainer: {
    marginBottom: 20,
    width: '100%'
  },
  orderInfoItem: {
    marginBottom: 8
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 6,
    alignItems: 'flex-start'
  },
  label: {
    fontSize: 10,
    color: '#666666',
    width: 80,
    textAlign: 'right',
    marginRight: 8
  },
  value: {
    fontSize: 10,
    flex: 1
  },
  orderInfo: {
    fontSize: 12,
    marginBottom: 4,
    textAlign: 'right'
  },
  billTo: {
    marginTop: 20,
    marginBottom: 30
  },
  billToTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8
  },
  billToText: {
    fontSize: 10,
    marginBottom: 4,
    color: '#444444'
  },
  table: {
    marginTop: 20,
    marginBottom: 20
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#cccccc',
    paddingBottom: 8,
    backgroundColor: '#f8f9fa'
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#eeeeee',
    paddingVertical: 8
  },
  description: { width: '40%' },
  quantity: { width: '20%', textAlign: 'right' },
  price: { width: '20%', textAlign: 'right' },
  amount: { width: '20%', textAlign: 'right' },
  totalsContainer: {
    marginTop: 20,
    marginLeft: 'auto',
    width: '40%',
    borderTop: '1px solid #cccccc',
    paddingTop: 8
  },
  totalRow: {
    flexDirection: 'row',
    paddingVertical: 4,
    marginBottom: 2
  },
  totalLabel: {
    width: '50%',
    textAlign: 'right',
    paddingRight: 8,
    fontSize: 10,
    color: '#666666'
  },
  totalValue: {
    width: '50%',
    textAlign: 'right',
    fontSize: 10
  },
  finalTotal: {
    borderTopWidth: 1,
    borderTopColor: '#cccccc',
    marginTop: 4,
    paddingTop: 4
  },
  boldText: {
    fontWeight: 'bold',
    color: '#000000',
    fontSize: 11
  },
  bankDetails: {
    marginTop: 30,
    padding: 10,
    backgroundColor: '#f8f9fa'
  },
  bankDetailsTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8
  },
  bankDetailsText: {
    fontSize: 10,
    marginBottom: 4,
    color: '#666666'
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    textAlign: 'center',
    fontSize: 10,
    color: '#666666'
  }
});

interface InvoicePDFProps {
  order: Order & {
    customerName?: string;
    customerEmail?: string;
    customerPhone?: string;
    customerAddress?: string;
    customerCompany?: string;
    customerReferenceNumber?: string;
  };
}

const InvoicePDF: React.FC<InvoicePDFProps> = ({ order }) => {
  // Calculate totals
  const totalAmount = order.totalAmount;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.leftColumn}>
            <Image src={LOGO_URL} style={styles.logo} />
            <Text style={styles.companyName}>Rocktex Investment T/A Royal Precast</Text>
            <Text style={styles.companyInfo}>1 Seke Rd, Corner Seke and George Rd</Text>
            <Text style={styles.companyInfo}>Harare</Text>
            <Text style={styles.companyInfo}>VOIP: 0864427939</Text>
            <Text style={styles.companyInfo}>Cell: 0714 120 493/0777769182</Text>
            <Text style={styles.companyInfo}>Email: sales@royalprecast.co.zw</Text>
            <Text style={styles.companyInfo}>TIN Number: 2000921535</Text>
            <Text style={styles.companyInfo}>VAT Number: 220296971</Text>
          </View>
          
          <View style={styles.rightColumn}>
            <Text style={styles.title}>
              {order.status === 'quotation' ? 'PROFORMA INVOICE' : 'INVOICE'}
            </Text>
            <View style={styles.orderInfoContainer}>
              <View style={styles.orderInfoItem}>
                <View style={styles.infoRow}>
                  <Text style={styles.label}>Date:</Text>
                  <Text style={styles.value}>{order.createdAt.toLocaleDateString()}</Text>
                </View>
              </View>
              <View style={styles.orderInfoItem}>
                <View style={styles.infoRow}>
                  <Text style={styles.label}>Order No:</Text>
                  <Text style={styles.value}>{order.id}</Text>
                </View>
              </View>
              {order.customerReferenceNumber && (
                <View style={styles.orderInfoItem}>
                  <View style={styles.infoRow}>
                    <Text style={styles.label}>Ref:</Text>
                    <Text style={styles.value}>{order.customerReferenceNumber}</Text>
                  </View>
                </View>
              )}
            </View>
          </View>
        </View>

        <View style={styles.billTo}>
          <Text style={styles.billToTitle}>Bill To:</Text>
          <Text style={styles.billToText}>{order.customerName || 'N/A'}</Text>
          {order.customerCompany && (
            <Text style={styles.billToText}>{order.customerCompany}</Text>
          )}
          <Text style={styles.billToText}>{order.customerAddress || 'N/A'}</Text>
          <Text style={styles.billToText}>Email: {order.customerEmail || 'N/A'}</Text>
          <Text style={styles.billToText}>Phone: {order.customerPhone || 'N/A'}</Text>
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.description}>DESCRIPTION</Text>
            <Text style={styles.quantity}>QUANTITY</Text>
            <Text style={styles.price}>UNIT PRICE</Text>
            <Text style={styles.amount}>AMOUNT</Text>
          </View>
          
          {order.products.map((product, index) => (
            <View key={index} style={styles.tableRow}>
              <Text style={styles.description}>{product.name}</Text>
              <Text style={styles.quantity}>{product.quantity}</Text>
              <Text style={styles.price}>${product.unitPrice.toFixed(2)}</Text>
              <Text style={styles.amount}>
                ${(product.quantity * product.unitPrice).toFixed(2)}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.totalsContainer}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal:</Text>
            <Text style={styles.totalValue}>
              ${((order.totalAmount || 0) / 1.15).toFixed(2)}
            </Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>VAT (15%):</Text>
            <Text style={styles.totalValue}>
              ${(order.vatAmount || 0).toFixed(2)}
            </Text>
          </View>
          <View style={[styles.totalRow, styles.finalTotal]}>
            <Text style={[styles.totalLabel, styles.boldText]}>Total:</Text>
            <Text style={[styles.totalValue, styles.boldText]}>
              ${order.totalAmount.toFixed(2)}
            </Text>
          </View>
        </View>

        <View style={styles.bankDetails}>
          <Text style={styles.bankDetailsTitle}>ACCOUNT DETAILS</Text>
          <Text style={styles.bankDetailsText}>ACC NAME: ROCKTEX INVESTMENTS(PVT) LTD</Text>
          <Text style={styles.bankDetailsText}>BANK: FBC GRANITESIDE</Text>
          <Text style={styles.bankDetailsText}>ZWL ACC NO: 6197015970197</Text>
          <Text style={styles.bankDetailsText}>USD ACC NO: 6897015970197</Text>
          <Text style={styles.bankDetailsText}>Reference: Order #{order.id}</Text>
        </View>

        <View style={styles.footer}>
          <Text>Thank you for your business!</Text>
          <Text>This is a computer-generated document. No signature is required.</Text>
        </View>
      </Page>
    </Document>
  );
};

export default InvoicePDF;