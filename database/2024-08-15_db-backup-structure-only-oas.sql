-- Table structure for table `app_appointment`; 

DROP TABLE IF EXISTS `app_appointment`; 

CREATE TABLE `app_appointment` (
  `ap_id` int(11) NOT NULL AUTO_INCREMENT,
  `ap_learn_type` int(1) NOT NULL,
  `ap_quota` int(11) NOT NULL,
  `ap_date_start` datetime NOT NULL,
  `ap_date_end` datetime NOT NULL,
  `ap_remark` varchar(256) NOT NULL,
  `dlt_code` varchar(3) NOT NULL,
  `crt_date` datetime NOT NULL,
  `udp_date` datetime NOT NULL,
  `cancelled` int(1) NOT NULL DEFAULT 1,
  `user_crt` int(11) NOT NULL COMMENT 'app_user.user_id',
  `user_udp` int(11) NOT NULL COMMENT 'app_user.user_id	',
  PRIMARY KEY (`ap_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

-- Table structure for table `app_appointment_reserve`; 

DROP TABLE IF EXISTS `app_appointment_reserve`; 

CREATE TABLE `app_appointment_reserve` (
  `ar_id` int(11) NOT NULL AUTO_INCREMENT,
  `ap_id` int(11) NOT NULL COMMENT 'app_appointment.ap_id',
  `user_id` int(11) NOT NULL COMMENT 'app_user.user_id	',
  `udp_date` datetime NOT NULL,
  PRIMARY KEY (`ar_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

-- Table structure for table `app_country`; 

DROP TABLE IF EXISTS `app_country`; 

CREATE TABLE `app_country` (
  `country_id` int(11) NOT NULL AUTO_INCREMENT,
  `country_name_th` varchar(128) DEFAULT NULL,
  `country_name_eng` varchar(128) DEFAULT NULL,
  `country_official_name_th` varchar(128) DEFAULT NULL,
  `country_official_name_eng` varchar(128) DEFAULT NULL,
  `capital_name_th` varchar(128) DEFAULT NULL,
  `capital_name_eng` varchar(128) DEFAULT NULL,
  `zone` varchar(64) DEFAULT NULL,
  PRIMARY KEY (`country_id`)
) ENGINE=InnoDB AUTO_INCREMENT=197 DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

-- Table structure for table `app_course`; 

DROP TABLE IF EXISTS `app_course`; 

CREATE TABLE `app_course` (
  `course_id` int(11) NOT NULL AUTO_INCREMENT,
  `course_cover` varchar(128) NOT NULL,
  `course_code` varchar(128) NOT NULL,
  `course_name_lo` varchar(256) NOT NULL,
  `course_name_eng` varchar(256) NOT NULL,
  `course_description` varchar(1024) NOT NULL,
  `course_remark_a` varchar(512) NOT NULL,
  `course_remark_b` varchar(512) NOT NULL,
  `is_complete` int(1) NOT NULL DEFAULT 0,
  `active` int(1) NOT NULL DEFAULT 1,
  `crt_date` datetime NOT NULL,
  `udp_date` datetime NOT NULL,
  `cancelled` int(1) NOT NULL DEFAULT 1,
  `user_crt` int(11) NOT NULL COMMENT 'app_user.user_id',
  `user_udp` int(11) NOT NULL COMMENT 'app_user.user_id',
  PRIMARY KEY (`course_id`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

-- Table structure for table `app_course_cluster`; 

DROP TABLE IF EXISTS `app_course_cluster`; 

CREATE TABLE `app_course_cluster` (
  `cct_id` varchar(48) NOT NULL,
  `cg_id` int(11) NOT NULL COMMENT 'app_course_group.cg_id',
  `cg_amount_random` int(3) NOT NULL DEFAULT 0,
  `cg_sort` int(11) NOT NULL DEFAULT 0,
  `course_id` int(11) NOT NULL COMMENT 'app_course.course_id',
  PRIMARY KEY (`cct_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

-- Table structure for table `app_course_condition`; 

DROP TABLE IF EXISTS `app_course_condition`; 

CREATE TABLE `app_course_condition` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `cc_value_a` int(11) NOT NULL,
  `cc_value_b` int(11) NOT NULL,
  `cg_id` int(11) NOT NULL COMMENT 'app_course_group.cg_id',
  `course_id` int(11) NOT NULL COMMENT 'app_course.course_id',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

-- Table structure for table `app_course_document`; 

DROP TABLE IF EXISTS `app_course_document`; 

CREATE TABLE `app_course_document` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `cd_path` varchar(128) NOT NULL,
  `cd_name` varchar(128) NOT NULL,
  `course_id` int(11) NOT NULL COMMENT 'app_course.course_id',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

-- Table structure for table `app_course_group`; 

DROP TABLE IF EXISTS `app_course_group`; 

CREATE TABLE `app_course_group` (
  `cg_id` int(11) NOT NULL AUTO_INCREMENT,
  `cg_name_lo` varchar(256) NOT NULL,
  `cg_name_eng` varchar(256) NOT NULL,
  `cg_amount_random` int(3) NOT NULL DEFAULT 0,
  `crt_date` datetime NOT NULL,
  `udp_date` datetime NOT NULL,
  `active` int(1) NOT NULL DEFAULT 1,
  `cancelled` int(1) NOT NULL DEFAULT 1,
  `user_crt` int(11) NOT NULL COMMENT 'app_user.user_id	',
  `user_udp` int(11) NOT NULL COMMENT 'app_user.user_id	',
  PRIMARY KEY (`cg_id`)
) ENGINE=InnoDB AUTO_INCREMENT=25 DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

-- Table structure for table `app_course_lesson`; 

DROP TABLE IF EXISTS `app_course_lesson`; 

CREATE TABLE `app_course_lesson` (
  `cs_id` int(11) NOT NULL AUTO_INCREMENT,
  `cs_cover` varchar(128) NOT NULL,
  `cs_name_lo` varchar(512) NOT NULL,
  `cs_name_eng` varchar(512) NOT NULL,
  `cs_video` varchar(128) NOT NULL,
  `cs_description` text NOT NULL,
  `cs_sort` int(11) NOT NULL DEFAULT 0,
  `file_path` varchar(128) NOT NULL,
  `crt_date` datetime NOT NULL,
  `udp_date` datetime NOT NULL,
  `cancelled` int(1) NOT NULL DEFAULT 1,
  `user_crt` int(11) NOT NULL COMMENT 'app_user.user_id',
  `user_udp` int(11) NOT NULL COMMENT 'app_user.user_id',
  `cg_id` int(11) NOT NULL COMMENT 'app_course_group.cg_id',
  PRIMARY KEY (`cs_id`)
) ENGINE=InnoDB AUTO_INCREMENT=366 DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

-- Table structure for table `app_course_log`; 

DROP TABLE IF EXISTS `app_course_log`; 

CREATE TABLE `app_course_log` (
  `cl_id` int(11) NOT NULL AUTO_INCREMENT,
  `cs_id` int(11) NOT NULL COMMENT 'app_course_lesson.cs_id',
  `course_id` int(11) NOT NULL COMMENT 'app_course.course_id',
  `user_id` int(11) NOT NULL COMMENT 'app_user.user_id',
  `udp_date` datetime NOT NULL,
  PRIMARY KEY (`cl_id`)
) ENGINE=InnoDB AUTO_INCREMENT=405 DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

-- Table structure for table `app_dlt_card`; 

DROP TABLE IF EXISTS `app_dlt_card`; 

CREATE TABLE `app_dlt_card` (
  `id` varchar(128) NOT NULL,
  `card_number` varchar(64) NOT NULL,
  `full_name` varchar(128) NOT NULL,
  `address` varchar(512) NOT NULL,
  `front_img` varchar(128) NOT NULL,
  `back_img` varchar(128) NOT NULL,
  `issue_date` date NOT NULL,
  `expiry_date` date NOT NULL,
  `crt_date` datetime NOT NULL,
  `udp_date` datetime NOT NULL,
  `user_id` int(11) NOT NULL COMMENT 'app_user.user_id',
  `user_create` int(11) NOT NULL COMMENT 'app_user.user_id',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

-- Table structure for table `app_dlt_card_type`; 

DROP TABLE IF EXISTS `app_dlt_card_type`; 

CREATE TABLE `app_dlt_card_type` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `dlt_code` varchar(3) NOT NULL,
  `dlt_card_id` varchar(128) NOT NULL COMMENT 'app_dlt_card.id',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

-- Table structure for table `app_exam_cache`; 

DROP TABLE IF EXISTS `app_exam_cache`; 

CREATE TABLE `app_exam_cache` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `ec_score` int(3) NOT NULL DEFAULT 0,
  `is_complete` int(1) NOT NULL DEFAULT 0,
  `ec_id` int(11) NOT NULL COMMENT 'app_exam_choice',
  `eq_id` int(11) NOT NULL COMMENT 'app_exam_question.eq_id',
  `cg_id` int(11) NOT NULL COMMENT 'app_course_group.cg_id',
  `course_id` int(11) NOT NULL COMMENT 'app_course.course_id',
  `user_id` int(11) NOT NULL COMMENT 'app_user.user_id',
  `udp_date` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=22 DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

-- Table structure for table `app_exam_choice`; 

DROP TABLE IF EXISTS `app_exam_choice`; 

CREATE TABLE `app_exam_choice` (
  `ec_id` int(11) NOT NULL AUTO_INCREMENT,
  `ec_index` int(3) NOT NULL,
  `ec_name_lo` varchar(512) NOT NULL,
  `ec_name_eng` varchar(512) NOT NULL,
  `ec_image` varchar(128) NOT NULL,
  `cancelled` int(1) NOT NULL DEFAULT 1,
  `eq_id` int(11) NOT NULL COMMENT 'app_exam_question.eq_id',
  `cg_id` int(11) NOT NULL COMMENT 'app_course_group.cg_id	',
  PRIMARY KEY (`ec_id`)
) ENGINE=InnoDB AUTO_INCREMENT=2532 DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

-- Table structure for table `app_exam_main`; 

DROP TABLE IF EXISTS `app_exam_main`; 

CREATE TABLE `app_exam_main` (
  `em_id` int(11) NOT NULL AUTO_INCREMENT,
  `em_code` varchar(128) NOT NULL,
  `em_name_lo` varchar(256) NOT NULL,
  `em_name_eng` varchar(256) NOT NULL,
  `em_cover` varchar(128) NOT NULL,
  `em_description` varchar(256) NOT NULL,
  `em_random_amount` int(11) NOT NULL,
  `em_time` time NOT NULL,
  `em_measure` int(11) NOT NULL,
  `dlt_code` varchar(3) NOT NULL,
  `crt_date` datetime NOT NULL,
  `udp_date` datetime NOT NULL,
  `cancelled` int(11) NOT NULL DEFAULT 1,
  `user_crt` int(11) NOT NULL COMMENT 'app_user.user_id',
  `user_udp` int(11) NOT NULL COMMENT 'app_user.user_id',
  `course_id` int(11) NOT NULL COMMENT 'app_course.	course_id',
  PRIMARY KEY (`em_id`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

-- Table structure for table `app_exam_question`; 

DROP TABLE IF EXISTS `app_exam_question`; 

CREATE TABLE `app_exam_question` (
  `eq_id` int(11) NOT NULL AUTO_INCREMENT,
  `eq_name_lo` varchar(512) NOT NULL,
  `eq_name_eng` varchar(512) NOT NULL,
  `eq_image` varchar(128) NOT NULL,
  `eq_answer` int(3) NOT NULL,
  `cancelled` int(1) NOT NULL DEFAULT 1,
  `cg_id` int(11) NOT NULL COMMENT 'app_course_group.cg_id',
  PRIMARY KEY (`eq_id`)
) ENGINE=InnoDB AUTO_INCREMENT=745 DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

-- Table structure for table `app_exam_result`; 

DROP TABLE IF EXISTS `app_exam_result`; 

CREATE TABLE `app_exam_result` (
  `er_id` int(11) NOT NULL AUTO_INCREMENT,
  `er_score_total` int(11) NOT NULL,
  `er_question_total` int(11) NOT NULL,
  `er_start_time` datetime NOT NULL,
  `er_use_time` time NOT NULL,
  `crt_date` datetime NOT NULL,
  `udp_date` datetime NOT NULL,
  `user_id` int(11) NOT NULL COMMENT 'app_user.user_id	',
  `course_id` int(11) NOT NULL COMMENT 'app_course.course_id',
  PRIMARY KEY (`er_id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

-- Table structure for table `app_exam_time`; 

DROP TABLE IF EXISTS `app_exam_time`; 

CREATE TABLE `app_exam_time` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `et_time` time NOT NULL,
  `em_id` int(11) NOT NULL COMMENT 'app_exam_main.em_id',
  `user_id` int(11) NOT NULL COMMENT 'app_user.user_id',
  `udp_date` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

-- Table structure for table `app_main_result`; 

DROP TABLE IF EXISTS `app_main_result`; 

CREATE TABLE `app_main_result` (
  `mr_id` int(11) NOT NULL AUTO_INCREMENT,
  `mr_score` double NOT NULL,
  `mr_learn_type` int(1) NOT NULL,
  `mr_status` varchar(4) NOT NULL COMMENT 'pass , fail',
  `dlt_code` varchar(3) NOT NULL,
  `crt_date` datetime NOT NULL,
  `udp_date` datetime NOT NULL,
  `user_id` int(11) NOT NULL COMMENT 'app_user.user_id',
  PRIMARY KEY (`mr_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

-- Table structure for table `app_mobile_log_version`; 

DROP TABLE IF EXISTS `app_mobile_log_version`; 

CREATE TABLE `app_mobile_log_version` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `version` varchar(12) NOT NULL,
  `link_android` varchar(128) NOT NULL,
  `link_ios` varchar(128) NOT NULL,
  `description` varchar(512) NOT NULL,
  `crt_date` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

-- Table structure for table `app_news`; 

DROP TABLE IF EXISTS `app_news`; 

CREATE TABLE `app_news` (
  `news_id` int(11) NOT NULL AUTO_INCREMENT,
  `news_cover` varchar(128) NOT NULL,
  `news_video` varchar(128) NOT NULL,
  `news_title` varchar(128) NOT NULL,
  `news_description` text NOT NULL,
  `news_type` int(1) NOT NULL,
  `news_friendly` varchar(128) NOT NULL,
  `news_view` int(11) NOT NULL DEFAULT 0,
  `crt_date` datetime NOT NULL,
  `udp_date` datetime NOT NULL,
  `cancelled` int(1) NOT NULL DEFAULT 1,
  `user_crt` int(11) NOT NULL COMMENT 'app_user.user_id',
  `user_udp` int(11) NOT NULL COMMENT 'app_user.user_id',
  PRIMARY KEY (`news_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

-- Table structure for table `app_news_image`; 

DROP TABLE IF EXISTS `app_news_image`; 

CREATE TABLE `app_news_image` (
  `ni_id` int(11) NOT NULL AUTO_INCREMENT,
  `ni_path_file` varchar(128) NOT NULL,
  `ni_name_file` varchar(128) NOT NULL,
  `news_id` int(11) NOT NULL COMMENT 'app_news.news_id',
  PRIMARY KEY (`ni_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

-- Table structure for table `app_user`; 

DROP TABLE IF EXISTS `app_user`; 

CREATE TABLE `app_user` (
  `user_id` int(11) NOT NULL AUTO_INCREMENT,
  `user_name` varchar(64) NOT NULL,
  `user_password` varchar(128) NOT NULL,
  `user_prefrix` varchar(24) NOT NULL,
  `user_firstname` varchar(64) NOT NULL,
  `user_lastname` varchar(64) NOT NULL,
  `user_email` varchar(64) NOT NULL,
  `user_phone` varchar(64) NOT NULL,
  `user_type` int(1) NOT NULL COMMENT '1 = Super Admin , 2 = Staff , 3 = People',
  `active` int(1) NOT NULL DEFAULT 1,
  `crt_date` datetime NOT NULL,
  `udp_date` datetime NOT NULL,
  `cancelled` int(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci COMMENT='ตาราง User';

-- Table structure for table `app_user_detail`; 

DROP TABLE IF EXISTS `app_user_detail`; 

CREATE TABLE `app_user_detail` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `verify_account` varchar(28) NOT NULL DEFAULT 'unactive' COMMENT 'unactive ,phone_active ,system_active',
  `identification_number` varchar(24) NOT NULL,
  `user_img` varchar(128) NOT NULL,
  `user_birthday` date NOT NULL,
  `user_address` varchar(128) NOT NULL,
  `user_village` varchar(128) NOT NULL,
  `location_id` int(11) NOT NULL COMMENT 'app_zipcode_lao.id',
  `country_id` int(11) NOT NULL COMMENT 'app_country.country_id',
  `user_id` int(11) NOT NULL COMMENT 'app_user.user_id',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

-- Table structure for table `app_user_idcard`; 

DROP TABLE IF EXISTS `app_user_idcard`; 

CREATE TABLE `app_user_idcard` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `idcard_front` varchar(128) NOT NULL,
  `idcard_back` varchar(128) NOT NULL,
  `user_id` int(11) NOT NULL COMMENT 'app_user.user_id',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

-- Table structure for table `app_user_otp`; 

DROP TABLE IF EXISTS `app_user_otp`; 

CREATE TABLE `app_user_otp` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `otp_code` varchar(6) NOT NULL,
  `otp_ref` varchar(10) NOT NULL,
  `total_request` int(11) NOT NULL,
  `crt_date` datetime NOT NULL,
  `udp_date` datetime NOT NULL,
  `user_id` int(11) NOT NULL COMMENT 'app_user.user_id',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

-- Table structure for table `app_user_vrdls`; 

DROP TABLE IF EXISTS `app_user_vrdls`; 

CREATE TABLE `app_user_vrdls` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `student_id` varchar(64) NOT NULL,
  `user_id` int(11) NOT NULL COMMENT 'app_user.user_id	',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

-- Table structure for table `app_zipcode_lao`; 

DROP TABLE IF EXISTS `app_zipcode_lao`; 

CREATE TABLE `app_zipcode_lao` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `zipcode` varchar(128) NOT NULL,
  `zipcode_name` varchar(128) NOT NULL,
  `amphur_code` varchar(128) NOT NULL,
  `amphur_name` varchar(128) NOT NULL,
  `province_code` varchar(128) NOT NULL,
  `province_name` varchar(128) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=151 DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci COMMENT='ตารางรหัสไปรษณีย์ลาว';

