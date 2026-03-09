-- HR Schema for Oracle DB@GCP
-- Focus: Talent Management & Recruitment Integration
CREATE TABLE hr_departments (
    dept_id NUMBER PRIMARY KEY,
    dept_name VARCHAR2(100) NOT NULL,
    manager_id NUMBER,
    location VARCHAR2(100)
);
CREATE TABLE hr_employees (
    emp_id NUMBER PRIMARY KEY,
    first_name VARCHAR2(50),
    last_name VARCHAR2(50),
    email VARCHAR2(100),
    hire_date DATE,
    job_title VARCHAR2(100),
    dept_id NUMBER REFERENCES hr_departments(dept_id),
    salary NUMBER(12, 2)
);
CREATE TABLE hr_recruitment (
    req_id VARCHAR2(20) PRIMARY KEY,
    job_title VARCHAR2(100),
    dept_id NUMBER REFERENCES hr_departments(dept_id),
    status VARCHAR2(20),
    -- 'Open', 'Interviewing', 'Offer', 'Filled'
    applicants_count NUMBER DEFAULT 0,
    target_hire_date DATE
);
-- Initial Mock Data
INSERT INTO hr_departments
VALUES (10, 'Engineering', 101, 'San Francisco');
INSERT INTO hr_departments
VALUES (20, 'Sales', 201, 'New York');
INSERT INTO hr_employees
VALUES (
        101,
        'Alice',
        'Chen',
        'alice@nexus.com',
        TO_DATE('2022-01-15', 'YYYY-MM-DD'),
        'Engineering Director',
        10,
        185000
    );
INSERT INTO hr_employees
VALUES (
        201,
        'Bob',
        'Wilson',
        'bob@nexus.com',
        TO_DATE('2021-06-10', 'YYYY-MM-DD'),
        'VP Sales',
        20,
        195000
    );
INSERT INTO hr_recruitment
VALUES (
        'REQ-2024-001',
        'Staff AI Engineer',
        10,
        'Interviewing',
        12,
        TO_DATE('2024-06-01', 'YYYY-MM-DD')
    );
INSERT INTO hr_recruitment
VALUES (
        'REQ-2024-002',
        'Cloud Solutions Architect',
        10,
        'Open',
        5,
        TO_DATE('2024-07-15', 'YYYY-MM-DD')
    );