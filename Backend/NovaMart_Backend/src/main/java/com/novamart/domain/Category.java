package com.novamart.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "categories")
@Getter
@Setter
@NoArgsConstructor
public class Category {
    @Id
    @Column(length = 40)
    private String id;

    @Column(nullable = false, unique = true, length = 100)
    private String name;

    public Category(String id, String name) {
        this.id = id;
        this.name = name;
    }
}