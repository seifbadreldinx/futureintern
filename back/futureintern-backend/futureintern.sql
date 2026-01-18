-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1:3306
-- Generation Time: Dec 17, 2025 at 07:21 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.0.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `futureintern`
--

-- --------------------------------------------------------

--
-- Table structure for table `applications`
--

CREATE TABLE `applications` (
  `id` int(11) NOT NULL,
  `student_id` int(11) NOT NULL,
  `internship_id` int(11) NOT NULL,
  `cover_letter` text DEFAULT NULL,
  `resume_url` varchar(500) DEFAULT NULL,
  `status` varchar(20) DEFAULT 'pending',
  `applied_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `internships`
--

CREATE TABLE `internships` (
  `id` int(11) NOT NULL,
  `title` varchar(200) NOT NULL,
  `description` text NOT NULL,
  `requirements` text DEFAULT NULL,
  `location` varchar(200) DEFAULT NULL,
  `duration` varchar(100) DEFAULT NULL,
  `stipend` varchar(100) DEFAULT NULL,
  `application_deadline` date DEFAULT NULL,
  `start_date` date DEFAULT NULL,
  `company_id` int(11) NOT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `internships`
--

INSERT INTO `internships` (`id`, `title`, `description`, `requirements`, `location`, `duration`, `stipend`, `application_deadline`, `start_date`, `company_id`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'Backend Developer Intern', 'Work on Flask APIs, database design, and backend systems. Great opportunity to learn modern web development.', 'Python, Flask, MySQL, Git', 'Cairo', '3 months', '3000 EGP/month', '2025-12-31', '2026-01-15', 2, 1, '2025-12-17 14:49:13', '2025-12-17 14:49:13');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `email` varchar(120) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role` varchar(20) NOT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `university` varchar(100) DEFAULT NULL,
  `major` varchar(100) DEFAULT NULL,
  `skills` text DEFAULT NULL,
  `interests` text DEFAULT NULL,
  `bio` text DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `company_name` varchar(100) DEFAULT NULL,
  `company_description` text DEFAULT NULL,
  `company_website` varchar(200) DEFAULT NULL,
  `company_location` varchar(200) DEFAULT NULL,
  `is_verified` tinyint(1) DEFAULT 0,
  `resume_url` varchar(500) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `name`, `email`, `password_hash`, `role`, `created_at`, `university`, `major`, `skills`, `interests`, `bio`, `phone`, `company_name`, `company_description`, `company_website`, `company_location`, `is_verified`, `resume_url`) VALUES
(2, 'HR Manager', 'hr@techcorp.com', 'scrypt:32768:8:1$pRfxtV1v77dJ0Ya7$401424585fc263e1d1cdd870ba08d1d3469b7d87f85e65993a35d8ad9a4437a53b83a2f6db4505a5a54d7ecd0baa57d3137b40b86766c9fa77437cb425cdd7fc', 'company', '2025-12-17 14:48:01', NULL, NULL, NULL, NULL, NULL, NULL, 'Tech Corp Egypt', NULL, NULL, NULL, 1, NULL),
(6, 'Admin User', 'admin@futureintern.com', 'scrypt:32768:8:1$6Np85kBJfe23QH3g$a2b3052986bb8644af958fe23a6728f559d98403987810e78dbfa8695d5a68c1b5b9d4edf82ed9a59dbc91713edb2d6bfb73cd373ca8ca27f2d2d7590f2f3047', 'admin', '2025-12-17 17:37:20', 'System', 'Administration', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL),
(7, 'Ahmed Hassan', 'ahmed@student.com', 'scrypt:32768:8:1$IlcL9XGR10MQaQ7S$b8a86d858bf45e7efd84e4e21b986b050a697434a237bdc328ea85b51002a5c134f6c3381d465a24649e809dd74bdc0bce41890456bc6391b72cd4ae9cff7495', 'student', '2025-12-17 17:57:14', 'Cairo University', 'Computer Science', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `applications`
--
ALTER TABLE `applications`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_application` (`student_id`,`internship_id`),
  ADD KEY `internship_id` (`internship_id`);

--
-- Indexes for table `internships`
--
ALTER TABLE `internships`
  ADD PRIMARY KEY (`id`),
  ADD KEY `company_id` (`company_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `applications`
--
ALTER TABLE `applications`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `internships`
--
ALTER TABLE `internships`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `applications`
--
ALTER TABLE `applications`
  ADD CONSTRAINT `applications_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `applications_ibfk_2` FOREIGN KEY (`internship_id`) REFERENCES `internships` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `internships`
--
ALTER TABLE `internships`
  ADD CONSTRAINT `internships_ibfk_1` FOREIGN KEY (`company_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
