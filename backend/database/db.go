package database

import (
	"context"
	"log"
	"os"

	"github.com/Samuel-k276/backend/models"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

// GetDB retorna a conexão com o banco de dados
var db *pgxpool.Pool

func GetDB() *pgxpool.Pool {
	return db
}

// Function that creates all the tables needed
func CreateTables() {

	// This query creates the table "carrinhos", "produtos_carrinho", "produtos"
	query := `
	
	CREATE TABLE IF NOT EXISTS products (
		id_product TEXT PRIMARY KEY,
		name TEXT NOT NULL,
		normalized_name TEXT NOT NULL,
		unit TEXT NOT NULL,
		pos_x INTEGER DEFAULT 0, 
		pos_y INTEGER DEFAULT 0,
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
	);
	
	CREATE TABLE IF NOT EXISTS donors (
		id_donor TEXT PRIMARY KEY,
		name TEXT NOT NULL,
		normalized_name TEXT NOT NULL,
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
	);

	CREATE TABLE IF NOT EXISTS cars (
		id_car TEXT PRIMARY KEY,
		type TEXT NOT NULL,
		date_export TEXT DEFAULT '0' 
	);

	CREATE TABLE IF NOT EXISTS products_car (
		id SERIAL PRIMARY KEY,
		id_car TEXT NOT NULL,
		id_product TEXT NOT NULL,
		quantity REAL DEFAULT 1,
		expiration TEXT NOT NULL,
		description TEXT NOT NULL,

		FOREIGN KEY (id_car) REFERENCES cars(id_car),
		FOREIGN KEY (id_product) REFERENCES products(id_product)
	);
	`
	// Executing the query on the DB
	_, err := db.Exec(context.Background(), query)

	if err != nil {
		log.Fatalf("Error Creating the Tables: %v", err)
	}

	// Add demo products
	err = AddDemoProducts(db)
	if err != nil {
		log.Fatalf("Error Adding Demo Products: %v", err)
	}

	// Add demo donors
	err = AddDemoDonors(db)
	if err != nil {
		log.Fatalf("Error Adding Demo Donors: %v", err)
	}

}

// Starts the connection with the PostgreSQL server
func InitDB() (*pgxpool.Pool, error) {

	// Create connection pool configuration
	config, err := pgxpool.ParseConfig(os.Getenv("DATABASE_URL"))
	if err != nil {
		return nil, err
	}

	// Disable prepared statements - use simple protocol
	config.ConnConfig.DefaultQueryExecMode = pgx.QueryExecModeSimpleProtocol

	// Create the connection pool with the config
	db, err = pgxpool.NewWithConfig(context.Background(), config)
	if err != nil {
		return nil, err
	}

	// Tests the connection
	if err = db.Ping(context.Background()); err != nil {
		return nil, err
	}

	// Starts the tables
	CreateTables()

	return db, nil
}

// Adds demo products do the DB
func AddDemoProducts(db *pgxpool.Pool) error {
	// struct of the products
	products := []struct {
		ID   string
		Name string
		Unit string
	}{
		// ALIMENTAÇÃO
		{"GAMR0001", "AÇUCAR", "UNID."},
		{"GAMR0065", "AGUA 33CL/50CL (MINERAL e GÁS)", "UNID."},
		{"GAMR0078", "AGUA LT", "UNID."},
		{"GAMR0003", "ARROZ", "UNID."},
		{"GAMR0005", "ATUM EM CONSERVA", "UNID."},
		{"GAMR0007", "AZEITE 1LT", "UNID."},
		{"GAMR0010", "BATATA FRITA", "UNID."},
		{"GAMR0012", "BOLACHAS", "UNID."},
		{"GAMR0098", "BOLOS/BISCOITOS", "UNID."},
		{"GAMR0013", "CAFÉ SOLUVEL", "UNID."},
		{"GAMR0063", "CALDOS", "UNID."},
		{"GAMR0014", "CEREAIS (Iva 23%)", "UNID."},
		{"GAMR0133", "CEREAIS CORNFLAKES (Iva 6%)", "UNID."},
		{"GAMR0130", "CHA (6%)", "UNID."},
		{"GAMR0048", "CHA (Iva 23%)", "UNID."},
		{"GAMR0015", "CHOCOLATE EM PO (NESQUICK,...)", "UNID."},
		{"GAMR0100", "CHOCOLATE EM PÓ P/ BOLOS", "UNID."},
		{"GAMR0017", "COGUMELOS EM LATA", "UNID."},
		{"GAMR0139", "COMPOTA/DOCE/NUTELA (Iva 23%)", "UNID."},
		{"GAMR0039", "COMPOTAS (Iva 6%)", "UNID."},
		{"GAMR0092", "CONSERVAS (EXCEPTO ATUM)", "UNID."},
		{"GAMR0051", "COUSCOUS", "UNID."},
		{"GAMR0018", "ERVILHAS EM LATA", "UNID."},
		{"GAMR0066", "ESPECIARIAS (Iva 6%)", "UNID."},
		{"GAMR0019", "FARINHA", "UNID."},
		{"GAMR0040", "FARINHA MAIZENA", "UNID."},
		{"GAMR0020", "FEIJAO EM LATA", "UNID."},
		{"GAMR0143", "FLOCOS DE AVEIA (Iva 13%)", "UNID."},
		{"GAMR0002", "FRUTA EM CALDA", "UNID."},
		{"GAMR0088", "FRUTOS SECOS", "PC"},
		{"GAMR0021", "GELATINA", "UNID."},
		{"GAMR0022", "GRAO EM LATA", "UNID."},
		{"GAMR0087", "GULOSEIMAS", "PC"},
		{"GAMR0068", "KETCHUP", "UNID."},
		{"GAMR0127", "LEGUMINOSAS EM CONSERVA", "UNID."},
		{"GAMR0093", "LEGUMINOSAS SECAS", "UNID."},
		{"GALT0021", "LEITE 3+ 1L", "UNID."},
		{"GALT0008", "LEITE 33CL", "UNID."},
		{"GAMR0061", "LEITE COCO/AMÊNDOA", "UNID."},
		{"GAMR0069", "LEITE CONDENSADO", "UNID."},
		{"GALT00011", "LEITE EM PÓ 1", "UNID."},
		{"GALT00012", "LEITE EM PÓ 2", "UNID."},
		{"GALT00013", "LEITE EM PÓ 3", "UNID."},
		{"GALT00014", "LEITE EM PÓ 4 e 5", "UNID."},
		{"GALT00010", "LEITE EM PÓ ESPECIAL", "UNID."},
		{"GALT0009", "LEITE LT", "UNID."},
		{"GAMR0071", "MARMELADA", "UNID."},
		{"GAMR0026", "MASSA e ESPARGUETE", "UNID."},
		{"GAMR0072", "MEL", "UNID."},
		{"GAMR0041", "MILHO EM LATA", "UNID."},
		{"GAMR0073", "MOLHOS VARIADOS", "UNID."},
		{"GAMR0028", "OLEO ALIMENTAR", "UNID."},
		{"GAMR0124", "PÃO FRESCO (UNI.)", "UNID."},
		{"GAMR0132", "PAPAS (Iva 23%)", "UNID."},
		{"GAMR0032", "PAPAS (Iva 6%)", "UNID."},
		{"GAMR0103", "POLPA DE FRUTA P/ BEBER", "UNID."},
		{"GAMR0062", "PUDIM/MOUSSE INSTANTÂNEO", "UNID."},
		{"GAMR0035", "PURÉ DE BATATA", "UNID."},
		{"GAMR0011", "PURÉ DE FRUTA", "UNID."},
		{"GAMR0126", "REFEIÇÕES PRÉ FEITAS/PRONTA A COMER", "UNID."},
		{"GAMR0059", "SAL FINO", "UNID."},
		{"GAMR0036", "SAL GROSSO", "UNID."},
		{"GAMR0037", "SALSICHAS EM LATA", "UNID."},
		{"GAMR00127", "SNACKS", "UNID."},
		{"GAMR0095", "SOBREMESAS PRONTA A COMER", "UNID."},
		{"GAMR0131", "SUMOS 20CL/33CL (Iva 23%)", "UNID."},
		{"GAMR0076", "SUMOS 20CL/33CL-100% e NECTARES (Iva 6%)", "UNID."},
		{"GAMR0045", "SUMOS LT (Iva 23%)", "UNID."},
		{"GAMR0134", "SUMOS LT 100% E NECTAR (Iva 6%)", "UNID."},
		{"GAMR0038", "TOMATE PELADO", "UNID."},
		{"GAMR0057", "TOMATE POLPA", "UNID."},
		{"GAMR0129", "TOSTAS", "UNID."},
		{"GAMR0054", "VINAGRE", "UNID."},
		{"GAMR0077", "VINHO", "LT"},

		// PRODUTOS DE LIMPEZA
		{"PLDT0001", "AMACIADOR ROUPA", "UNID."},
		{"PLDT0021", "CHAMPÔ VIATURAS", "UNID."},
		{"PLDT0019", "DETERG. MAQ. LOIÇA", "UNID."},
		{"PLDT0003", "DETERGENTE LOIÇA (À MÃO)", "UNID."},
		{"PLDT0005", "DETERGENTE ROUPA", "UNID."},
		{"PLAC0003", "ESFREGÃO VERDE", "UNID."},
		{"PHOU100102", "GEL MAOS DESINFECTANTE", "UNID."},
		{"PLDT0007", "LAVA TUDO (P/ CHÃO)", "UNID."},
		{"PLDT0009", "LIMPA VIDROS", "UNID."},
		{"PLDT0020", "LIMPA WC", "UNID."},
		{"PLDT0010", "LIXIVIA", "UNID."},
		{"PLAC0001", "LUVAS DESCARTÁVEIS CX 50/100", "CX"},
		{"PLAC0007", "LUVAS DESCARTÁVEIS CX. 10", "CX"},
		{"PLAC0005", "LUVAS LIMPEZA", "UNID."},
		{"PLAC0006", "PANOS DE LIMPEZA", "UNID."},
		{"PHPH0007", "PAPEL HIGIENICO", "UNID."},
		{"PHPH0009", "ROLO DE COZINHA", "UNID."},
		{"PHPH003", "SABONETE LIQUIDO", "UNID."},
		{"PLAC0004", "SACOS LIXO 100L", "UNID."},
		{"PLAC0002", "SACOS LIXO 30L/50L", "UNID."},
		{"PLDT0014", "TIRA GORDURAS (inclui Cif e outros)", "UNID."},
		{"PLDT00015", "TIRA NÓDOAS", "UNID."},

		// HIGIENE, PUERICULTURA E FARMÁCIA
		{"PHPH0001", "AGUA COLONIA", "UNID."},
		{"FRMP0053", "AGUA DO MAR", "UNID."},
		{"FRMP0039", "AGUA OXIGENADA", "UNID."},
		{"FRMP0045", "AGUA/ GEL LIMPEZA ROSTO BEBE", "UNID."},
		{"FRMP0040", "ALCOOL ETILICO", "UNID."},
		{"FRMP0042", "ALGODAO", "UNID."},
		{"PHPH0015", "AMACIADOR CABELO", "UNID."},
		{"FRMD0030", "ANALGÉSICOS", "UNID."},
		{"FRMD0017", "ANTI-INFLAMATÓRIO", "UNID."},
		{"FRMD0018", "ANTI-PIRÉTICO", "UNID."},
		{"PCPC0016", "BABETES BORRACHA", "UNID."},
		{"PCPC0006", "BABETES DE PAPEL DESC.", "EMB."},
		{"PCPC0002", "BIBERONS", "UNID."},
		{"PHPH0028", "CHAMPÔ ADULTO", "UNID."},
		{"PHPH0002", "CHAMPÔ CRIANÇA", "UNID."},
		{"PHPH0024", "CHAMPÔ PIOLHOS", "UNID."},
		{"PCPC0004", "CHUPETAS", "UNID."},
		{"FRMP0028", "COMPRESSAS", "UNID."},
		{"FRMP0036", "COTONETES", "UNID."},
		{"PHPH0005", "CREME/LEITE/LOÇÃO HIDRAT. CRIANÇA", "UNID."},
		{"PHPH0031", "CREME/LOÇÃO/LEITE HIDRAT. ADULTO", "UNID."},
		{"PCPC0014", "MORDEDOR DENTES", "UNID."},
		{"FRMP0043", "DESINFETANTE BIBERONS", "UNID."},
		{"PHPH0034", "DESODORIZANTE", "UNID."},
		{"PHPH0030", "ELIXIR", "UNID."},
		{"PHPH0026", "ESCOVA DENTES ADULTO", "UNID."},
		{"PHPH0013", "ESCOVA DENTES CRIANÇA", "UNID."},
		{"PHPH0016", "ESCOVA/PENTE DE CABELO", "UNID."},
		{"PCPC0013", "ESCOVILHÕES", "UNID."},
		{"PHPH0025", "ESPONJA BANHO", "UNID."},
		{"PCPC00033", "FRALDA CUECA (TODOS TAM.)", "UNID."},
		{"PCPC00032", "FRALDA PIJAMA (TODOS TAM.)", "UNID."},
		{"PCPC00034", "FRALDA PRAIA/PISCINA", "UNID."},
		{"PCPC00024", "FRALDAS TAM. 0", "UNID."},
		{"PCPC00025", "FRALDAS TAM. 1", "UNID."},
		{"PCPC00026", "FRALDAS TAM. 2", "UNID."},
		{"PCPC00027", "FRALDAS TAM. 3", "UNID."},
		{"PCPC00028", "FRALDAS TAM. 4", "UNID."},
		{"PCPC00029", "FRALDAS TAM. 5", "UNID."},
		{"PCPC00030", "FRALDAS TAM. 6", "UNID."},
		{"PCPC00031", "FRALDAS TAM. S/M", "UNID."},
		{"PHPH0029", "GEL DE BANHO ADULTO", "UNID."},
		{"PHPH0004", "GEL DE BANHO CRIANÇA", "UNID."},
		{"PHPH0021", "GUARDANAPOS", "UNID."},
		{"PHPH0023", "KITS VARIOS DE HIGIENE", "UNID."},
		{"PHPH0022", "LENÇOS DE PAPEL BOLSO/CAIXA", "PC"},
		{"PCPC0010", "LOIÇA PLASTICO", "UNID."},
		{"PCPC0008", "LUZES DE PRESENCA", "UNID."},
		{"FRMP0041", "MASCARAS", "CX"},
		{"PCPC0009", "OCULOS + CAIXA", "UNID."},
		{"PHPH0037", "OLEO AMENDOAS DOCES", "EMB."},
		{"PHPH0006", "OLEO BEBE", "UNID."},
		{"PHPH0027", "PASTA DE DENTES ADULTO", "UNID."},
		{"PHPH0008", "PASTA DE DENTES BEBÉ/CRIANÇA", "UNID."},
		{"PHPH0033", "PENSOS HIGIÉNICOS", "EMB."},
		{"FRMP0032", "PENSOS RAPIDOS", "EMB."},
		{"FRMP0024", "POMADA MUDA FRALDA (Iva 23%)", "UNID."},
		{"FRMD0036", "POMADA MUDA FRALDA (Iva 6%)", "UNID."},
		{"PCPC0007", "PORTA CHUPETAS/CORRENTES", "UNID."},
		{"FRMP0038", "PROTETOR SOLAR", "UNID."},
		{"PCPC0005", "RESGUARDOS", "UNID."},
		{"FRMP0027", "SORO CAIXA", "CX"},
		{"FRMP0029", "SORO FRASCO", "UNID."},
		{"FRMP0035", "TERMOMETROS", "UNID."},
		{"PHPH0038", "TESOURA UNHAS", "UNID."},
		{"PCPC0003", "TETINAS", "UNID."},
		{"PHPH0011", "TOALHITAS", "UNID."},

		// OUTROS
		{"VAVA0011", "PAPEL VEGETAL", "UNID."},
		{"VAVA0012", "PELICULA ADERENTE", "UNID."},
		{"VAVA0013", "PAPEL ALUMINIO", "UNID."},
		{"VAVA0014", "SACOS ALIMENTAÇÃO", "EMB."},

		// ECONOMATO
		{"MTMT0001", "RESMA PAPEL A4", "UNI"},
		{"MTMT0002", "RESMA PAPEL A3", "UNI"},
		{"MTMT0003", "CADERNOS A4", "UNI"},
		{"MTMT0004", "CADERNOS A5", "UNI"},
		{"MTMT0005", "LÁPIS grafite", "UNI"},
		{"MTMT0006", "LÁPIS DE COR (caixa 12)", "CX"},
		{"MTMT0007", "LÁPIS DE CERA (caixa 12)", "CX"},
		{"MTMT0008", "CANETAS ESFEROGRÁFICAS", "UNI"},
		{"MTMT0009", "CANETAS FELTRO (caixa 12)", "CX"},
		{"MTMT0010", "AFIAS", "UNI"},
		{"MTMT0011", "BORRACHAS", "UNI"},
		{"MTMT0012", "RÉGUAS", "UNI"},
		{"MTMT0013", "MARCADOR FLUORESCENTE", "UNI"},
		{"MTMT0014", "TINTAS ACRÍLICAS (caixa 12)", "CX"},
		{"MTMT0015", "PAPEL CREPE", "UNI"},
		{"MTMT0016", "MOCHILAS", "UNI"},
		{"MTMT0017", "PASTA DE MODELAR", "UNI"},
		{"MTMT0018", "CAPAS C/ ELÁSTICO", "UNI"},
		{"MTMT0019", "COLA (LÍQUIDA/TUBO)", "UNI"},
		{"MTMT0020", "RECARGAS FOLHAS A4 (Dossier)", "UNI"},
		{"MTMT0021", "TESOURA", "UNI"},
		{"MTMT0022", "BLOCO DESENHO A4 (Cavalinho)", "UNI"},
		{"MTMT0023", "PINCÉIS", "UNI"},
		{"MTMT0024", "PAPEL LUSTRO", "UNI"},
		{"MTMT0025", "PLASTICINA", "UNI"},
		{"MTMT0026", "ESTOJOS", "UNI"},
		{"MTMT0027", "CARTOLINAS AVULSO", "UNI"},
		{"MTMT0028", "AGUARELAS", "UNI"},
		{"MTMT0029", "FITA COLA", "UNI"},
		{"MTMT0030", "CORRETOR", "UNI"},
		{"MTMT0031", "GUACHES", "UNI"},
		{"MTMT0032", "PAPEL MANTEIGA", "UNI"},
		{"MTMT0033", "COMPASSO", "UNI"},
		{"MTMT0034", "AGRAFADOR", "UNI"},
		{"MTMT0035", "AGRAFOS", "CX"},
		{"MTMT0036", "FURADOR", "UNI"},
		{"MTMT0037", "CLIPS", "CX"},
		{"MTMT0038", "DOSSIERS", "UNI"},
		{"MTMT0039", "GIZ", "CX"},
		{"MTMT0040", "ELÁSTICOS", "CX"},
		{"MTMT0041", "SEPARADORES", "UNI"},
		{"MTMT0042", "PILHAS", "EMB"},
		{"MTMT0043", "MICAS", "EMB"},
		{"MTMT0044", "CADERNOS A3", "UNI"},
	}
	// Query to insert demo products into the database
	query := `
		INSERT INTO products (id_product, name, normalized_name, unit) 
		VALUES ($1, $2, $3, $4)
		ON CONFLICT (id_product) DO NOTHING
	`

	// Insert demo products
	for _, product := range products {
		normalizedName := models.NormalizeText(product.Name)
		_, err := db.Exec(context.Background(), query, product.ID, product.Name, normalizedName, product.Unit)
		if err != nil {
			return err
		}
	}

	return nil
}

// Adds demo donors do the DB
func AddDemoDonors(db *pgxpool.Pool) error {
	// struct of the products
	donors := []struct {
		ID   string
		Name string
	}{
		{"1", "BANCO ALIMENTAR"},
		{"12", "PARTICULAR"},
		{"13", "NESTLE"},
		{"14", "LACTOGAL"},
		{"15", "GELPEIXE"},
		{"16", "CHICCO"},
		{"17", "SANOFI"},
		{"18", "LIDL"},
		{"19", "JUMBO/AUCHAN"},
		{"24", "SODIFER"},
		{"26", "Mariadelina-Confeções e Presentes, Lda"},
		{"27", "REFOOD"},
		{"28", "NESTLÉ"},
		{"29", "Santa Casa da Misericórdia"},
		{"30", "Pingo Doce"},
		{"31", "Agilidade S.A."},
		{"32", "FARMÁCIA PAES UNIPESSOAL LDA."},
		{"33", "ALTER, SA"},
		{"34", "FARMÁCIA HIGIENE"},
		{"35", "FARMÁCIA BELÉM"},
		{"36", "Perrigot Portugal, Lda."},
		{"37", "Banco de Bens Doados ENTREAJUDA"},
		{"38", "Farmácia Uruguai"},
		{"39", "Farmácia Uruguai"},
		{"40", "Banco Farmacêutico"},
		{"41", "Makro - Cash&Carry Portugal SA"},
		{"42", "Whitestar e Norfin"},
		{"43", "Boehringer"},
		{"44", "FARMÁCIA AGUIAR"},
		{"45", "NOVELO SOLIDÁRIO"},
		{"46", "AXIANS"},
		{"47", "Quinta do Estanho"},
		{"48", "TPF - Consultores de Engenharia e Arquitetura"},
		{"49", "LUSO - Química, Lda"},
		{"50", "Biocodex Lda"},
		{"51", "GATIEN, LDA."},
		{"52", "FARMÁCIA FERNÃO FERRO"},
		{"53", "ABÍLIO DE CAMPOS LEITE (PIZZARIA)"},
		{"54", "Y FARMA, SA"},
		{"55", "ASSOCIAÇÃO MOVIMENTO 1 EURO"},
		{"56", "PROCTER&GAMBLE PORTUGAL SA"},
		{"57", "OSKON. TECH. LDA"},
		{"58", "IogOSKON, Lda."},
		{"59", "ATLANTICONCEITO LDA."},
		{"60", "WIRECONSULT, LDA."},
		{"61", "HERO PORTUGAL - Produção e Comércio"},
		{"62", "Laura Fernandes Esteves Cosme Xirigo"},
		{"63", "FARMIMPROVE - CONSULTORIA DE"},
		{"64", "alida castro group"},
		{"65", "GRUPO MEDINFAR (HOLON)"},
		{"66", "IQVIA Solutions Portugal, Unipessoal, Lda"},
		{"67", "LONGA VIDA Ind. Lacteas, S.A."},
	}

	// Query to insert demo donors into the database
	query := `
		INSERT INTO donors (id_donor, name, normalized_name) 
		VALUES ($1, $2, $3)
		ON CONFLICT (id_donor) DO NOTHING
	`

	// Insert demo donors
	for _, donor := range donors {
		normalizedName := models.NormalizeText(donor.Name)
		_, err := db.Exec(context.Background(), query, donor.ID, donor.Name, normalizedName)
		if err != nil {
			return err
		}
	}

	return nil
}
