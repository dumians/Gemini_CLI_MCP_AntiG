-- Oracle FlexCube Schema (Mock)

-- Customers
CREATE TABLE sttm_customer (
    customer_no VARCHAR2(20) PRIMARY KEY, -- Customer Number (Identifier)
    fullname VARCHAR2(255) NOT NULL,
    country VARCHAR2(50),
    segment VARCHAR2(20) -- Segment (e.g., Retail, Corporate)
);

-- Accounts
CREATE TABLE catm_account (
    account_no VARCHAR2(30) PRIMARY KEY,
    customer_no VARCHAR2(20) REFERENCES sttm_customer(customer_no),
    ccy VARCHAR2(3), -- Currency
    acct_status VARCHAR2(2), -- Status
    current_bal NUMBER(15, 2) -- Balance
);

-- Transactions
CREATE TABLE detm_transaction (
    trn_ref_no VARCHAR2(50) PRIMARY KEY,
    ac_no VARCHAR2(30) REFERENCES catm_account(account_no),
    drcr_ind VARCHAR2(1), -- Debit/Credit
    lcy_amount NUMBER(15, 2), -- Amount
    trn_dt DATE
);

-- Seed Data
INSERT INTO sttm_customer (customer_no, fullname, country, segment)
VALUES ('CUS-001', 'John Banking', 'USA', 'Retail');
INSERT INTO catm_account (account_no, customer_no, ccy, acct_status, current_bal)
VALUES ('ACC-BANK-001', 'CUS-001', 'USD', 'A', 5000.00);
INSERT INTO detm_transaction (trn_ref_no, ac_no, drcr_ind, lcy_amount, trn_dt)
VALUES ('TRN-001', 'ACC-BANK-001', 'D', 100.00, SYSDATE);
