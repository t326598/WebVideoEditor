CREATE TABLE video_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  filename VARCHAR(255),
  start_time DOUBLE,
  end_time DOUBLE,
  edited_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
