package com.heartmirror.repository;

import com.heartmirror.entity.AISetting;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AISettingRepository extends JpaRepository<AISetting, Long> {
    Optional<AISetting> findByUserId(Long userId);
    void deleteByUserId(Long userId);
}