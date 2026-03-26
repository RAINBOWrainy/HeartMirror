package com.heartmirror.repository;

import com.heartmirror.entity.Intervention;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface InterventionRepository extends JpaRepository<Intervention, Long> {
    List<Intervention> findByUserIdOrderByCreatedAtDesc(Long userId);
    List<Intervention> findByUserIdAndStatus(Long userId, Intervention.Status status);
    Optional<Intervention> findByIdAndUserId(Long id, Long userId);

    @Query("SELECT COUNT(i) FROM Intervention i WHERE i.userId = ?1 AND i.status = 'ACTIVE'")
    Long countActiveByUserId(Long userId);

    @Query("SELECT i.interventionType, COUNT(i) FROM Intervention i WHERE i.userId = ?1 GROUP BY i.interventionType")
    List<Object[]> countByType(Long userId);

    @Query("SELECT i FROM Intervention i WHERE i.userId = ?1 AND i.targetEmotions LIKE %?2% AND i.status = 'ACTIVE'")
    List<Intervention> findByTargetEmotion(Long userId, String emotion);

    @Query("SELECT COUNT(i) FROM Intervention i WHERE i.userId = ?1")
    Long countByUserId(Long userId);
}