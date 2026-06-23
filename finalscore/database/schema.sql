CREATE DATABASE IF NOT EXISTS FinalScore;
USE FinalScore;

CREATE TABLE IF NOT EXISTS usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  senha VARCHAR(255) NOT NULL,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS campeonato (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NOT NULL,
  nome VARCHAR(100) NOT NULL,
  descricao TEXT NOT NULL,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_campeonato_usuario
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS times (
  id INT AUTO_INCREMENT PRIMARY KEY,
  campeonato_id INT NOT NULL,
  nome VARCHAR(100) NOT NULL,
  cidade VARCHAR(100) NOT NULL,
  estadio VARCHAR(150) NOT NULL,
  escudo VARCHAR(500),
  cor VARCHAR(50) NOT NULL,
  forca INT DEFAULT 0,
  ataque INT DEFAULT 0,
  defesa INT DEFAULT 0,
  pontos INT DEFAULT 0,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_times_campeonato
    FOREIGN KEY (campeonato_id) REFERENCES campeonato(id)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS partidas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  campeonato_id INT NOT NULL,
  rodada INT NOT NULL,
  local VARCHAR(200) NOT NULL,
  time_mandante_id INT NOT NULL,
  time_visitante_id INT NOT NULL,
  gols_mandante INT DEFAULT 0,
  gols_visitante INT DEFAULT 0,
  resultado VARCHAR(20) NOT NULL,
  status ENUM('agendada', 'finalizada') DEFAULT 'agendada',
  data_partida DATE,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_partidas_campeonato
    FOREIGN KEY (campeonato_id) REFERENCES campeonato(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_partidas_mandante
    FOREIGN KEY (time_mandante_id) REFERENCES times(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_partidas_visitante
    FOREIGN KEY (time_visitante_id) REFERENCES times(id)
    ON DELETE CASCADE
);

INSERT INTO usuarios (nome, email, senha)
VALUES ('Gabriel', 'admin@email.com', '123456');

INSERT INTO usuarios (nome, email, senha)
VALUES ('Thiago', 'admin2@email.com', '1234567');
