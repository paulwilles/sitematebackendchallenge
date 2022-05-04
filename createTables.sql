IF NOT EXISTS (SELECT name, xtype FROM sysobjects 
WHERE name = 'Issues' AND xtype = 'U')
BEGIN
	create table Issues (
    id VARCHAR(36) PRIMARY KEY,
    title VARCHAR(50) NOT NULL,
    description VARCHAR(100) NULL
  );
END;