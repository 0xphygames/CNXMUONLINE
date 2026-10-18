/*
  Histórico de resets para rankings diário, semanal e mensal.
  Execute no banco MuOnline antes de publicar a aplicação.
*/

IF OBJECT_ID(N'dbo.MU_ResetHistory', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.MU_ResetHistory (
    Id INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_MU_ResetHistory PRIMARY KEY,
    CharacterName VARCHAR(10) NOT NULL,
    ResetCount INT NOT NULL CONSTRAINT DF_MU_ResetHistory_ResetCount DEFAULT (1),
    CreatedAt DATETIME2(0) NOT NULL CONSTRAINT DF_MU_ResetHistory_CreatedAt DEFAULT (SYSUTCDATETIME())
  );

  CREATE INDEX IX_MU_ResetHistory_CreatedAt
    ON dbo.MU_ResetHistory (CreatedAt, CharacterName);

  CREATE INDEX IX_MU_ResetHistory_CharacterName
    ON dbo.MU_ResetHistory (CharacterName, CreatedAt);
END;
GO

CREATE OR ALTER TRIGGER dbo.trg_Character_ResetHistory
ON dbo.Character
AFTER UPDATE
AS
BEGIN
  SET NOCOUNT ON;

  INSERT INTO dbo.MU_ResetHistory (CharacterName, ResetCount)
  SELECT
    i.Name,
    i.ResetCount - ISNULL(d.ResetCount, 0)
  FROM inserted AS i
  INNER JOIN deleted AS d ON d.Name = i.Name
  WHERE i.ResetCount > ISNULL(d.ResetCount, 0);
END;
GO
