CREATE TABLE "casos" (
	"id" varchar(50) PRIMARY KEY NOT NULL,
	"titulo" varchar(255) NOT NULL,
	"cliente" varchar(255) NOT NULL,
	"materia" varchar(100) NOT NULL,
	"tribunal" varchar(100),
	"status" varchar(50) NOT NULL,
	"prazo_final" timestamp,
	"resumo" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "eventos_caso" (
	"id" varchar(50) PRIMARY KEY NOT NULL,
	"caso_id" varchar(50),
	"data" timestamp NOT NULL,
	"descricao" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "historico_pipeline" (
	"id" varchar(50) PRIMARY KEY NOT NULL,
	"pedido_id" varchar(50),
	"etapa" varchar(100) NOT NULL,
	"descricao" text NOT NULL,
	"data" timestamp NOT NULL,
	"responsavel" varchar(255)
);
--> statement-breakpoint
CREATE TABLE "minutas" (
	"id" varchar(50) PRIMARY KEY NOT NULL,
	"pedido_id" varchar(50),
	"titulo" varchar(255) NOT NULL,
	"conteudo_atual" text
);
--> statement-breakpoint
CREATE TABLE "partes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"caso_id" varchar(50),
	"nome" varchar(255) NOT NULL,
	"papel" varchar(50) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pedidos_peca" (
	"id" varchar(50) PRIMARY KEY NOT NULL,
	"caso_id" varchar(50),
	"titulo" varchar(255) NOT NULL,
	"tipo_peca" varchar(150) NOT NULL,
	"prioridade" varchar(50) NOT NULL,
	"status" varchar(50) NOT NULL,
	"etapa_atual" varchar(100) NOT NULL,
	"responsavel" varchar(255),
	"prazo_final" timestamp,
	"criado_em" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "teses_juridicas" (
	"id" varchar(100) PRIMARY KEY NOT NULL,
	"codigo" varchar(50) NOT NULL,
	"titulo" varchar(255) NOT NULL,
	"tese_base" text NOT NULL,
	"status" varchar(50) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"initials" varchar(10),
	"role" varchar(100),
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "versoes_minuta" (
	"id" varchar(50) PRIMARY KEY NOT NULL,
	"minuta_id" varchar(50),
	"numero" integer NOT NULL,
	"criado_em" timestamp DEFAULT now() NOT NULL,
	"autor" varchar(255) NOT NULL,
	"resumo_mudancas" text,
	"conteudo" text NOT NULL,
	"contexto_versao_origem" integer,
	"template_id_origem" varchar(255),
	"materia_canonica_origem" varchar(150)
);
--> statement-breakpoint
ALTER TABLE "eventos_caso" ADD CONSTRAINT "eventos_caso_caso_id_casos_id_fk" FOREIGN KEY ("caso_id") REFERENCES "public"."casos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "historico_pipeline" ADD CONSTRAINT "historico_pipeline_pedido_id_pedidos_peca_id_fk" FOREIGN KEY ("pedido_id") REFERENCES "public"."pedidos_peca"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "minutas" ADD CONSTRAINT "minutas_pedido_id_pedidos_peca_id_fk" FOREIGN KEY ("pedido_id") REFERENCES "public"."pedidos_peca"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partes" ADD CONSTRAINT "partes_caso_id_casos_id_fk" FOREIGN KEY ("caso_id") REFERENCES "public"."casos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pedidos_peca" ADD CONSTRAINT "pedidos_peca_caso_id_casos_id_fk" FOREIGN KEY ("caso_id") REFERENCES "public"."casos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "versoes_minuta" ADD CONSTRAINT "versoes_minuta_minuta_id_minutas_id_fk" FOREIGN KEY ("minuta_id") REFERENCES "public"."minutas"("id") ON DELETE cascade ON UPDATE no action;