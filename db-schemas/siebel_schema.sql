-- Siebel CRM Schema (Mock)

-- Accounts (Organizations)
CREATE TABLE s_org_ext (
    row_id VARCHAR2(15) PRIMARY KEY, -- Row ID (Identifier)
    name VARCHAR2(100) NOT NULL, -- Account Name
    loc VARCHAR2(100), -- Location
    cust_stat_cd VARCHAR2(30) -- Customer Status
);

-- Contacts
CREATE TABLE s_contact (
    row_id VARCHAR2(15) PRIMARY KEY,
    fst_name VARCHAR2(50),
    last_name VARCHAR2(50),
    email_addr VARCHAR2(255),
    pr_dept_id VARCHAR2(15) -- Dept ID (Correlation with HR)
);

-- Opportunities
CREATE TABLE s_opty (
    row_id VARCHAR2(15) PRIMARY KEY,
    name VARCHAR2(100),
    desc_text VARCHAR2(255),
    sum_win_prob NUMBER(3, 0), -- Probability
    sum_revenue NUMBER(15, 2), -- Revenue
    target_acct_id VARCHAR2(15) REFERENCES s_org_ext(row_id)
);

-- Seed Data
INSERT INTO s_org_ext (row_id, name, loc, cust_stat_cd)
VALUES ('1-A1', 'Acme Corp', 'New York', 'Active');
INSERT INTO s_contact (row_id, fst_name, last_name, email_addr, pr_dept_id)
VALUES ('1-B1', 'John', 'Doe', 'john.doe@acme.com', 'D101');
INSERT INTO s_opty (row_id, name, desc_text, sum_win_prob, sum_revenue, target_acct_id)
VALUES ('1-C1', 'Big Deal', 'Q1 Expansion', 80, 50000.00, '1-A1');
