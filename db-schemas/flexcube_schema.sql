CREATE TABLE flexcube_transactions (
    trn_ref_no VARCHAR2(20) PRIMARY KEY,
    ac_no VARCHAR2(20),
    drcr_ind CHAR(1),
    lcy_amount NUMBER(15,2),
    trn_dt DATE
);
