package com.heartmirror.repository;

import com.heartmirror.entity.Diary;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface DiaryRepository extends JpaRepository<Diary, Long> {
    List<Diary> findByUserIdOrderByDateDesc(Long userId);
    Optional<Diary> findByIdAndUserId(Long id, Long userId);
    Optional<Diary> findByUserIdAndDate(Long userId, LocalDate date);
    List<Diary> findByUserIdAndDateBetweenOrderByDateDesc(Long userId, LocalDate start, LocalDate end);
}