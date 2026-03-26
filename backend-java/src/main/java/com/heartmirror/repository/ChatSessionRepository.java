package com.heartmirror.repository;

import com.heartmirror.entity.ChatSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ChatSessionRepository extends JpaRepository<ChatSession, Long> {
    List<ChatSession> findByUserIdOrderByCreatedAtDesc(Long userId);
    List<ChatSession> findByUserIdAndStatusOrderByCreatedAtDesc(Long userId, ChatSession.Status status);
    Optional<ChatSession> findByIdAndUserId(Long id, Long userId);

    @Query("SELECT COUNT(c) FROM ChatSession c WHERE c.userId = ?1")
    Long countByUserId(Long userId);
}