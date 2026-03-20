package com.projectmanager.platform.repository;

import com.projectmanager.platform.domain.AppUser;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface AppUserRepository extends JpaRepository<AppUser, UUID> {
    Optional<AppUser> findByEmail(String email);
    boolean existsByEmail(String email);
    List<AppUser> findAllByEnabledTrueOrderByNameAsc();
    List<AppUser> findByIdInAndEnabledTrueOrderByNameAsc(Collection<UUID> ids);
}
