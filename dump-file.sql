CREATE TABLE IF NOT EXISTS kitty (
	id INT NOT NULL,
	genes INT NULL,
	birthtime INT NULL,
	cooldownendblock INT NULL,
	matronId INT NULL,
	sireId INT NULL,
	siringwith INT NULL,
	cooldownindex INT NULL,
	generation INT NULL,
	CONSTRAINT "primary" PRIMARY KEY (id ASC),
	FAMILY "primary" (id, genes, birthtime, cooldownendblock, matronId, sireId, siringwith, cooldownindex, generation)
);
