-- Oracle BRM Schema (Mock)

-- Accounts
CREATE TABLE account_t (
    poid_id0 NUMBER PRIMARY KEY, -- POID (Portal Object ID)
    account_no VARCHAR2(30) NOT NULL, -- Account Number
    cust_seg_list VARCHAR2(255), -- Customer Segments
    status NUMBER(1, 0) -- Status (1 = Active)
);

-- Invoices
CREATE TABLE invoice_t (
    poid_id0 NUMBER PRIMARY KEY,
    account_obj_id0 NUMBER REFERENCES account_t(poid_id0),
    invoice_no VARCHAR2(30),
    total_amount NUMBER(15, 2),
    due_date DATE
);

-- Services
CREATE TABLE service_t (
    poid_id0 NUMBER PRIMARY KEY,
    account_obj_id0 NUMBER REFERENCES account_t(poid_id0),
    login VARCHAR2(255), -- Username or Service ID
    type VARCHAR2(100) -- Service Type (e.g., Telecom, Broadband)
);

-- Seed Data
INSERT INTO account_t (poid_id0, account_no, cust_seg_list, status)
VALUES (10001, 'ACC-001', 'Gold', 1);
INSERT INTO invoice_t (poid_id0, account_obj_id0, invoice_no, total_amount, due_date)
VALUES (20001, 10001, 'INV-2026-01', 150.00, SYSDATE + 30);
